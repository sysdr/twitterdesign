import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { ModelPredictor } from './services/modelPredictor.js';
import { MetricsCollector } from './services/metricsCollector.js';
import { ValidationEngine } from './services/validationEngine.js';
import { ABTestingService } from './services/abTestingService.js';
import { ProductionSimulator } from './services/productionSimulator.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize services
const predictor = new ModelPredictor();
const collector = new MetricsCollector();
const validator = new ValidationEngine();
const abTesting = new ABTestingService(validator);
const simulator = new ProductionSimulator();

// REST API Routes
app.get('/api/models', (req, res) => {
  const models = ['timeline_latency', 'cache_hit_rate', 'queue_depth'].map(name => 
    predictor.getModel(name)
  );
  res.json(models.filter(Boolean));
});

app.get('/api/accuracy', (req, res) => {
  const accuracies = validator.getAllModelAccuracies();
  res.json(accuracies);
});

app.get('/api/validations/:modelName', (req, res) => {
  const { modelName } = req.params;
  const validations = validator.getRecentValidations(modelName, 50);
  res.json(validations);
});

app.get('/api/tests', (req, res) => {
  const tests = abTesting.getAllTests();
  res.json(tests);
});

app.post('/api/tests', (req, res) => {
  const { name, controlModel, treatmentModel } = req.body;
  const test = abTesting.createTest(
    name,
    controlModel,
    treatmentModel
  );
  res.json(test);
});

app.get('/api/metrics/current', (req, res) => {
  const metrics = simulator.getMetrics();
  res.json(metrics);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✓ Model Validation API running on port ${PORT}`);
});

// WebSocket for real-time updates
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to validation stream');
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Broadcast to all connected clients
function broadcast(data: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// Main validation loop
setInterval(() => {
  // Simulate production
  simulator.tick();
  const metrics = simulator.getMetrics();

  // Generate predictions
  const models = predictor.getModelNames();
  
  models.forEach(modelName => {
    const modelConfig = predictor.getModel(modelName);
    const prediction = predictor.generatePrediction(modelName, metrics);
    
    // Collect actual metrics based on model type
    let actualMetric;
    switch (modelConfig?.type) {
      case 'latency':
        actualMetric = collector.collectTimelineLatency(metrics.arrivalRate);
        break;
      case 'cache':
        actualMetric = collector.collectCacheHitRate(
          metrics.cacheHits,
          metrics.totalRequests
        );
        break;
      case 'queue':
        actualMetric = collector.collectQueueDepth(metrics.queueDepth);
        break;
    }

    // Validate predictions against actuals
    if (actualMetric) {
      const validationResults = validator.validate(prediction, [actualMetric]);
      
      // Check if accuracy threshold violated
      const meetsThreshold = validator.checkAccuracyThreshold(modelName, 95);
      
      if (!meetsThreshold) {
        console.log(`⚠ Model ${modelName} accuracy below 95% threshold`);
      }

      // Broadcast results
      broadcast({
        type: 'validation',
        modelName,
        results: validationResults,
        accuracy: validator.getModelAccuracy(modelName, prediction.modelVersion),
        meetsThreshold
      });
    }
  });

  // Update active A/B tests
  abTesting.getActiveTests().forEach(test => {
    abTesting.updateTestMetrics(test.id);
    broadcast({
      type: 'ab_test_update',
      test
    });
  });

}, 2000); // Every 2 seconds

console.log('✓ Validation loop started');
console.log('✓ Generating predictions and validating against production metrics...');

// Cleanup old metrics every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  collector.clearOldMetrics(fiveMinutesAgo);
}, 5 * 60 * 1000);

// Create initial A/B test
setTimeout(() => {
  const timelineModel = predictor.getModel('timeline_latency');
  if (timelineModel) {
    // Create treatment model with adjusted parameters
    const treatmentModel = {
      ...timelineModel,
      name: `${timelineModel.name}_treatment`,
      version: '1.1',
      parameters: {
        ...timelineModel.parameters,
        serviceRate: timelineModel.parameters.serviceRate * 1.05
      }
    };

    predictor.addModel(treatmentModel);

    const test = abTesting.createTest(
      'Timeline Latency Model Improvement',
      timelineModel,
      treatmentModel
    );
    console.log(`✓ Created A/B test: ${test.name}`);
  }
}, 5000);
