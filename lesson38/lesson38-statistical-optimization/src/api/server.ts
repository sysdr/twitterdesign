import express from 'express';
import cors from 'cors';
import { BayesianOptimizer, Parameter, Configuration } from '../bayesian-optimizer/BayesianOptimizer';
import { ABTestController } from '../ab-testing/ABTestController';
import { MetricsAggregator } from '../metrics/MetricsAggregator';
import { ConfigurationManager } from '../config-manager/ConfigurationManager';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize system components
const parameters: Parameter[] = [
  { name: 'cacheTTL', min: 60, max: 600, type: 'discrete', step: 30 },
  { name: 'batchSize', min: 10, max: 100, type: 'discrete', step: 5 },
  { name: 'workerThreads', min: 2, max: 16, type: 'discrete', step: 1 }
];

const initialConfig = {
  cacheTTL: 300,
  batchSize: 50,
  workerThreads: 8
};

const optimizer = new BayesianOptimizer(parameters);
const abTestController = new ABTestController();
const metricsAggregator = new MetricsAggregator();
const configManager = new ConfigurationManager(initialConfig);

let currentConfig: Configuration = initialConfig;
let isOptimizing = false;

// Simulate system load
function simulateSystemLoad(): void {
  setInterval(() => {
    // Generate latency based on current configuration
    const baseLatency = 100;
    const configEffect = 
      (currentConfig.cacheTTL - 300) * -0.05 +  // Lower TTL = higher latency
      (currentConfig.batchSize - 50) * 0.3 +     // Larger batches = higher latency
      (currentConfig.workerThreads - 8) * -2;    // More threads = lower latency
    
    const latency = Math.max(20, baseLatency + configEffect + (Math.random() - 0.5) * 30);
    metricsAggregator.recordLatency(latency);

    // Occasional errors
    if (Math.random() < 0.02) {
      metricsAggregator.recordError();
    }

    // Aggregate metrics every minute
    const metrics = metricsAggregator.aggregate();
    if (metrics) {
      console.log(`Metrics: P95=${metrics.latencyP95.toFixed(1)}ms, ErrorRate=${(metrics.errorRate * 100).toFixed(2)}%, Score=${metricsAggregator.calculatePerformanceScore(metrics).toFixed(1)}`);
      
      // Check if we should optimize
      if (isOptimizing) {
        optimizationStep();
      }
    }
  }, 100); // Generate load every 100ms
}

async function optimizationStep(): Promise<void> {
  const metrics = metricsAggregator.getLatestMetrics();
  if (!metrics) return;

  const performanceScore = metricsAggregator.calculatePerformanceScore(metrics);
  
  // Record current configuration performance
  optimizer.addObservation(currentConfig, performanceScore);

  // Get next configuration to try
  const suggestion = optimizer.suggestNext();
  
  console.log(`\nBayesian Optimizer Trial ${optimizer.getTrialCount()}`);
  console.log(`Current config:`, currentConfig);
  console.log(`Performance score: ${performanceScore.toFixed(2)}`);
  console.log(`Next suggestion:`, suggestion.configuration);
  console.log(`Expected improvement: ${suggestion.expectedImprovement.toFixed(4)}`);
  console.log(`Exploration ratio: ${(suggestion.explorationRatio * 100).toFixed(1)}%`);

  // Start A/B test for new configuration
  if (abTestController.canStartNewTest()) {
    try {
      const testId = abTestController.startTest({
        name: `Config_Trial_${optimizer.getTrialCount()}`,
        controlConfig: currentConfig,
        experimentConfig: suggestion.configuration,
        trafficPercentage: 5,
        maxDuration: 1, // 1 hour
        metrics: ['latency', 'errorRate']
      });

      // Simulate A/B test traffic
      setTimeout(() => {
        const testConfig = suggestion.configuration;
        
        // Generate metrics for both groups
        for (let i = 0; i < 100; i++) {
          // Control group
          const controlLatency = 100 + (Math.random() - 0.5) * 20;
          abTestController.recordMetric(testId, 'latency', controlLatency, 'control');
          
          // Experiment group (with config effect)
          const expEffect = 
            (testConfig.cacheTTL - 300) * -0.05 +
            (testConfig.batchSize - 50) * 0.3 +
            (testConfig.workerThreads - 8) * -2;
          const expLatency = 100 + expEffect + (Math.random() - 0.5) * 20;
          abTestController.recordMetric(testId, 'latency', expLatency, 'experiment');
        }

        // Check test results
        const test = abTestController.getTest(testId);
        if (test && test.getStatus() === 'concluded') {
          const results = test.getResults();
          const latencyResult = results.find(r => r.metric === 'latency');
          
          if (latencyResult && latencyResult.significant && latencyResult.effectSize < -0.2) {
            // Improvement detected!
            console.log(`\n✓ Configuration improved performance by ${Math.abs(latencyResult.effectSize * 100).toFixed(1)}%`);
            currentConfig = suggestion.configuration;
            configManager.applyConfiguration(currentConfig, performanceScore);
          }
        }
      }, 5000); // Wait 5 seconds for test to run
      
    } catch (error) {
      console.error('Failed to start A/B test:', error);
    }
  }

  // Stop after 30 trials
  if (optimizer.getTrialCount() >= 30) {
    isOptimizing = false;
    const best = optimizer.getBestConfiguration();
    console.log(`\n=== Optimization Complete ===`);
    console.log(`Best configuration found:`, best?.configuration);
    console.log(`Best performance: ${best?.performance.toFixed(2)}`);
    console.log(`Total trials: ${optimizer.getTrialCount()}`);
  }
}

// API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    isOptimizing,
    currentConfig,
    trialCount: optimizer.getTrialCount(),
    activeTests: abTestController.getActiveTests().length
  });
});

app.post('/api/start-optimization', (req, res) => {
  if (isOptimizing) {
    return res.status(400).json({ error: 'Optimization already running' });
  }
  
  isOptimizing = true;
  res.json({ message: 'Optimization started' });
});

app.post('/api/stop-optimization', (req, res) => {
  isOptimizing = false;
  res.json({ message: 'Optimization stopped' });
});

app.get('/api/metrics', (req, res) => {
  const recent = metricsAggregator.getRecentMetrics(60);
  const latest = metricsAggregator.getLatestMetrics();
  const score = latest ? metricsAggregator.calculatePerformanceScore(latest) : 0;
  
  res.json({
    current: latest,
    recent,
    performanceScore: score
  });
});

app.get('/api/optimizer/best', (req, res) => {
  const best = optimizer.getBestConfiguration();
  res.json(best || { message: 'No observations yet' });
});

app.get('/api/optimizer/observations', (req, res) => {
  const observations = optimizer.getBestConfiguration();
  res.json({ observations });
});

app.get('/api/tests', (req, res) => {
  res.json({
    active: abTestController.getActiveTests().map(t => ({
      id: t.id,
      name: t.config.name,
      status: t.getStatus(),
      results: t.getResults()
    })),
    completed: abTestController.getCompletedTests().map(t => ({
      id: t.id,
      name: t.config.name,
      results: t.getResults()
    }))
  });
});

app.get('/api/config/history', (req, res) => {
  res.json({
    current: configManager.getCurrentConfiguration(),
    history: configManager.getHistory(),
    improvements: configManager.getImprovementHistory()
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log('Starting system simulation...');
  simulateSystemLoad();
});
