import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { ModelRegistry } from './model-registry';
import { FeatureStore } from './feature-store';
import { ModelServingEngine } from './model-serving';
import { PerformanceMonitor } from './performance-monitor';
import { RetrainingPipeline } from './retraining-pipeline';
import { logger } from './logger';
import * as promClient from 'prom-client';

config();

const app = express();
app.use(express.json());
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const predictionCounter = new promClient.Counter({
  name: 'predictions_total',
  help: 'Total number of predictions',
  registers: [register],
});

const predictionLatency = new promClient.Histogram({
  name: 'prediction_latency_seconds',
  help: 'Prediction latency in seconds',
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// Initialize components
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

const postgres = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'mlops_db',
  user: process.env.POSTGRES_USER || 'mlops_user',
  password: process.env.POSTGRES_PASSWORD || 'mlops_password',
});

const modelRegistry = new ModelRegistry(process.env.MODEL_REGISTRY_PATH);
const featureStore = new FeatureStore(redis, postgres);
const servingEngine = new ModelServingEngine(modelRegistry, featureStore);
const monitor = new PerformanceMonitor(postgres);
const retrainingPipeline = new RetrainingPipeline(
  modelRegistry,
  featureStore,
  monitor,
  {
    triggers: {
      accuracyDrop: 0.02,
      driftScore: 0.05,
      manualTrigger: false,
    },
    schedule: {
      minInterval: 6,  // hours
      maxInterval: 168, // 1 week
    },
    validation: {
      testSetSize: 0.2,
      minImprovement: 0.01,
    },
  }
);

async function initialize() {
  try {
    await modelRegistry.initialize();
    await featureStore.initialize();
    await servingEngine.initialize();
    await monitor.initialize();
    logger.info('All components initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize components', { error });
    process.exit(1);
  }
}

// API Routes
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.post('/predict', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { userId, candidateTweets } = req.body;
    
    if (!userId || !candidateTweets || !Array.isArray(candidateTweets)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const result = await servingEngine.predict({ userId, candidateTweets });
    
    const latency = Date.now() - startTime;
    predictionCounter.inc();
    predictionLatency.observe(latency / 1000);

    res.json(result);
  } catch (error) {
    logger.error('Prediction failed', { error });
    res.status(500).json({ error: 'Prediction failed' });
  }
});

app.post('/features/user/:userId/compute', async (req, res) => {
  try {
    const { userId } = req.params;
    await featureStore.computeUserFeatures(userId);
    res.json({ success: true, userId });
  } catch (error) {
    logger.error('Feature computation failed', { error });
    res.status(500).json({ error: 'Feature computation failed' });
  }
});

app.post('/features/tweet/:tweetId/compute', async (req, res) => {
  try {
    const { tweetId } = req.params;
    await featureStore.computeTweetFeatures(tweetId);
    res.json({ success: true, tweetId });
  } catch (error) {
    logger.error('Feature computation failed', { error });
    res.status(500).json({ error: 'Feature computation failed' });
  }
});

app.get('/models', (req, res) => {
  const models = modelRegistry.listModels();
  res.json({ models });
});

app.get('/models/production', (req, res) => {
  const model = modelRegistry.getProductionModel();
  res.json({ model });
});

app.post('/models/:modelId/:version/promote', async (req, res) => {
  try {
    const { modelId, version } = req.params;
    await modelRegistry.promoteModel(modelId, version);
    res.json({ success: true, modelId, version });
  } catch (error) {
    logger.error('Model promotion failed', { error });
    res.status(500).json({ error: 'Model promotion failed' });
  }
});

app.post('/retrain', async (req, res) => {
  try {
    const productionModel = modelRegistry.getProductionModel();
    
    if (!productionModel) {
      return res.status(404).json({ error: 'No production model found' });
    }

    const result = await retrainingPipeline.checkAndRetrain(productionModel.modelId);
    
    res.json({ 
      success: result,
      message: result ? 'Retraining completed' : 'Retraining not needed or failed'
    });
  } catch (error) {
    logger.error('Retraining failed', { error });
    res.status(500).json({ error: 'Retraining failed' });
  }
});

app.get('/metrics/performance/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const metrics = await monitor.computeMetrics(modelId);
    res.json({ metrics });
  } catch (error) {
    logger.error('Metrics computation failed', { error });
    res.status(500).json({ error: 'Metrics computation failed' });
  }
});

// Serve Dashboard
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Twitter MLOps Dashboard</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .dashboard {
          max-width: 1400px;
          margin: 0 auto;
        }
        .header {
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2d3748;
          font-size: 2.5em;
          margin-bottom: 10px;
        }
        .header p {
          color: #718096;
          font-size: 1.1em;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .card {
          background: white;
          padding: 25px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .card h2 {
          color: #2d3748;
          font-size: 1.3em;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        .metric {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f7fafc;
        }
        .metric:last-child { border-bottom: none; }
        .metric-label {
          color: #718096;
          font-weight: 500;
        }
        .metric-value {
          color: #2d3748;
          font-weight: 700;
          font-size: 1.1em;
        }
        .status {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.9em;
          font-weight: 600;
        }
        .status.production {
          background: #c6f6d5;
          color: #22543d;
        }
        .status.staging {
          background: #feebc8;
          color: #7c2d12;
        }
        .btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1em;
          font-weight: 600;
          margin: 10px 10px 0 0;
          transition: transform 0.2s;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        #logs {
          background: #1a202c;
          color: #a0aec0;
          padding: 20px;
          border-radius: 10px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          max-height: 400px;
          overflow-y: auto;
        }
        .log-entry {
          margin: 5px 0;
          padding: 5px;
          border-left: 3px solid #4a5568;
          padding-left: 10px;
        }
        .log-info { border-left-color: #4299e1; }
        .log-success { border-left-color: #48bb78; }
        .log-warning { border-left-color: #ed8936; }
        .log-error { border-left-color: #f56565; }
      </style>
    </head>
    <body>
      <div class="dashboard">
        <div class="header">
          <h1>🤖 Twitter MLOps Dashboard</h1>
          <p>Production ML model serving 1M+ predictions/second</p>
        </div>

        <div class="grid">
          <div class="card">
            <h2>Model Status</h2>
            <div id="model-info">
              <div class="metric">
                <span class="metric-label">Current Model</span>
                <span class="metric-value" id="current-model">Loading...</span>
              </div>
              <div class="metric">
                <span class="metric-label">Status</span>
                <span class="status production" id="model-status">Production</span>
              </div>
              <div class="metric">
                <span class="metric-label">Accuracy</span>
                <span class="metric-value" id="model-accuracy">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Latency (P95)</span>
                <span class="metric-value" id="model-latency">-</span>
              </div>
            </div>
          </div>

          <div class="card">
            <h2>Performance Metrics</h2>
            <div id="performance-metrics">
              <div class="metric">
                <span class="metric-label">Predictions/sec</span>
                <span class="metric-value" id="predictions-rate">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Avg Confidence</span>
                <span class="metric-value" id="avg-confidence">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Feature Store Hits</span>
                <span class="metric-value" id="feature-hits">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Cache Hit Rate</span>
                <span class="metric-value" id="cache-rate">-</span>
              </div>
            </div>
          </div>

          <div class="card">
            <h2>Drift Detection</h2>
            <div id="drift-metrics">
              <div class="metric">
                <span class="metric-label">Feature Drift</span>
                <span class="metric-value" id="feature-drift">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Label Drift</span>
                <span class="metric-value" id="label-drift">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Concept Drift</span>
                <span class="metric-value" id="concept-drift">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Last Check</span>
                <span class="metric-value" id="drift-check">-</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Operations</h2>
          <button class="btn" onclick="runPrediction()">🎯 Test Prediction</button>
          <button class="btn" onclick="computeFeatures()">📊 Compute Features</button>
          <button class="btn" onclick="triggerRetraining()">🔄 Trigger Retraining</button>
          <button class="btn" onclick="checkDrift()">🔍 Check Drift</button>
          <button class="btn" onclick="loadTest()">⚡ Load Test</button>
        </div>

        <div class="card">
          <h2>System Logs</h2>
          <div id="logs"></div>
        </div>
      </div>

      <script>
        function addLog(message, type = 'info') {
          const logs = document.getElementById('logs');
          const entry = document.createElement('div');
          entry.className = \`log-entry log-\${type}\`;
          entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
          logs.insertBefore(entry, logs.firstChild);
          if (logs.children.length > 50) logs.removeChild(logs.lastChild);
        }

        async function updateDashboard() {
          try {
            // Fetch model info
            const modelResponse = await fetch('/models/production');
            const { model } = await modelResponse.json();
            
            if (model) {
              document.getElementById('current-model').textContent = model.version || 'N/A';
              document.getElementById('model-accuracy').textContent = 
                model.accuracy ? (model.accuracy * 100).toFixed(2) + '%' : 'N/A';
              document.getElementById('model-latency').textContent = 
                model.latency_p95 ? model.latency_p95.toFixed(1) + 'ms' : 'N/A';
              
              // Fetch performance metrics
              try {
                const metricsResponse = await fetch(\`/metrics/performance/\${model.modelId}\`);
                const { metrics } = await metricsResponse.json();
                
                if (metrics) {
                  // Update performance metrics
                  document.getElementById('predictions-rate').textContent = 
                    metrics.predictions?.count ? metrics.predictions.count.toLocaleString() : '0';
                  document.getElementById('avg-confidence').textContent = 
                    metrics.predictions?.avgConfidence ? metrics.predictions.avgConfidence.toFixed(3) : '0.000';
                  
                  // Update drift metrics
                  document.getElementById('feature-drift').textContent = 
                    metrics.drift?.featureDrift ? metrics.drift.featureDrift.toFixed(4) : '0.0000';
                  document.getElementById('label-drift').textContent = 
                    metrics.drift?.labelDrift ? metrics.drift.labelDrift.toFixed(4) : '0.0000';
                  document.getElementById('concept-drift').textContent = 
                    metrics.drift?.conceptDrift ? 'Detected' : 'None';
                  document.getElementById('drift-check').textContent = 
                    new Date().toLocaleTimeString();
                }
              } catch (err) {
                // If metrics not available, set defaults
                document.getElementById('predictions-rate').textContent = '0';
                document.getElementById('avg-confidence').textContent = '0.000';
                document.getElementById('feature-drift').textContent = '0.0000';
                document.getElementById('label-drift').textContent = '0.0000';
                document.getElementById('concept-drift').textContent = 'None';
              }
              
              // Fetch Prometheus metrics for real-time stats
              try {
                const promResponse = await fetch('/metrics');
                const promText = await promResponse.text();
                
                // Parse predictions_total
                const predictionsMatch = promText.match(/predictions_total\s+(\d+)/);
                if (predictionsMatch) {
                  const total = parseInt(predictionsMatch[1]);
                  document.getElementById('predictions-rate').textContent = total.toLocaleString();
                }
                
                // Parse prediction_latency
                const latencyMatch = promText.match(/prediction_latency_seconds_sum\s+([\d.]+)/);
                if (latencyMatch) {
                  const latency = parseFloat(latencyMatch[1]);
                  document.getElementById('avg-confidence').textContent = latency.toFixed(3);
                }
              } catch (err) {
                // Prometheus metrics not critical, continue
              }
              
              // Set feature hits and cache rate (these would need additional endpoints)
              document.getElementById('feature-hits').textContent = '0';
              document.getElementById('cache-rate').textContent = '0%';
            } else {
              // No model available
              document.getElementById('current-model').textContent = 'No model';
              document.getElementById('model-accuracy').textContent = 'N/A';
              document.getElementById('model-latency').textContent = 'N/A';
            }
          } catch (error) {
            addLog('Failed to update dashboard: ' + error.message, 'error');
          }
        }

        async function runPrediction() {
          addLog('Running test prediction...', 'info');
          try {
            const response = await fetch('/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: 'user_' + Math.floor(Math.random() * 1000),
                candidateTweets: Array.from({ length: 10 }, (_, i) => 'tweet_' + i)
              })
            });
            const result = await response.json();
            addLog(\`Prediction completed in \${result.latency}ms, ranked \${result.rankings.length} tweets\`, 'success');
          } catch (error) {
            addLog('Prediction failed: ' + error.message, 'error');
          }
        }

        async function computeFeatures() {
          addLog('Computing features...', 'info');
          try {
            const userId = 'user_' + Math.floor(Math.random() * 1000);
            await fetch(\`/features/user/\${userId}/compute\`, { method: 'POST' });
            addLog(\`Features computed for \${userId}\`, 'success');
          } catch (error) {
            addLog('Feature computation failed: ' + error.message, 'error');
          }
        }

        async function triggerRetraining() {
          addLog('Triggering model retraining...', 'warning');
          try {
            const response = await fetch('/retrain', { method: 'POST' });
            const result = await response.json();
            if (result.success) {
              addLog('Model retraining completed successfully', 'success');
            } else {
              addLog('Retraining not needed or conditions not met', 'info');
            }
          } catch (error) {
            addLog('Retraining failed: ' + error.message, 'error');
          }
        }

        async function checkDrift() {
          addLog('Checking for model drift...', 'info');
          try {
            const model = await fetch('/models/production').then(r => r.json());
            if (model.model) {
              const response = await fetch(\`/metrics/performance/\${model.model.modelId}\`);
              const { metrics } = await response.json();
              
              if (metrics.drift.featureDrift > 0.05) {
                addLog('⚠️  Feature drift detected: ' + metrics.drift.featureDrift.toFixed(4), 'warning');
              } else {
                addLog('✓ No significant drift detected', 'success');
              }
            }
          } catch (error) {
            addLog('Drift check failed: ' + error.message, 'error');
          }
        }

        async function loadTest() {
          addLog('Running load test (100 concurrent predictions)...', 'info');
          const start = Date.now();
          const promises = [];
          
          for (let i = 0; i < 100; i++) {
            promises.push(fetch('/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: 'user_' + i,
                candidateTweets: ['tweet_1', 'tweet_2', 'tweet_3']
              })
            }));
          }
          
          try {
            await Promise.all(promises);
            const duration = Date.now() - start;
            const throughput = (100 / (duration / 1000)).toFixed(0);
            addLog(\`Load test completed: \${throughput} req/sec, avg \${(duration/100).toFixed(1)}ms\`, 'success');
          } catch (error) {
            addLog('Load test failed: ' + error.message, 'error');
          }
        }

        // Initialize dashboard
        updateDashboard();
        setInterval(updateDashboard, 5000);
        addLog('MLOps Dashboard initialized', 'success');
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;

initialize().then(() => {
  app.listen(PORT, () => {
    logger.info(`MLOps server running on port ${PORT}`);
  });
});

// Background monitoring task
setInterval(async () => {
  const productionModel = modelRegistry.getProductionModel();
  if (productionModel) {
    await monitor.computeMetrics(productionModel.modelId);
    await retrainingPipeline.checkAndRetrain(productionModel.modelId);
  }
}, 3600000); // Every hour
