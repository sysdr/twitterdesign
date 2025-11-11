import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { chaosInjector } from './chaos/injector.js';
import { metricsCollector } from './monitoring/metrics.js';
import { safetyGuardian } from './safety/guardian.js';
import { autoHealer } from './recovery/autohealer.js';
import { experimentTemplates } from './experiments/definitions.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    message: 'Chaos Engineering Backend is running',
    endpoints: [
      '/health',
      '/api/metrics',
      '/api/experiments',
      '/api/experiments/active'
    ]
  });
});

// Chaos injection middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Check if chaos should be injected
  const networkDelay = chaosInjector.getInjectedDelay('network');
  
  if (networkDelay > 0) {
    setTimeout(() => continueRequest(), networkDelay);
  } else {
    continueRequest();
  }

  function continueRequest() {
    // Check for service failure injection
    if (chaosInjector.shouldInjectFailure('api')) {
      const latency = Date.now() - startTime;
      metricsCollector.recordRequest(latency, true);
      return res.status(500).json({ error: 'Service temporarily unavailable (chaos injection)' });
    }

    // Continue with request
    const originalSend = res.send;
    res.send = function(data) {
      const latency = Date.now() - startTime;
      metricsCollector.recordRequest(latency, res.statusCode >= 400);
      return originalSend.call(this, data);
    };

    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = metricsCollector.getSystemHealth();
  res.json(health);
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  const metrics = metricsCollector.getMetrics();
  res.json(metrics);
});

// Experiments endpoints
app.get('/api/experiments', (req, res) => {
  const templates = Object.keys(experimentTemplates).map(key => {
    const experiment = experimentTemplates[key as keyof typeof experimentTemplates]();
    return {
      id: key,
      name: experiment.name,
      failureType: experiment.failureType,
      target: experiment.target
    };
  });
  res.json(templates);
});

app.get('/api/experiments/active', (req, res) => {
  const active = chaosInjector.getActiveExperiments();
  res.json(active);
});

app.post('/api/experiments/start', (req, res) => {
  const { experimentType } = req.body;
  
  if (!experimentTemplates[experimentType as keyof typeof experimentTemplates]) {
    return res.status(400).json({ error: 'Unknown experiment type' });
  }

  const experiment = experimentTemplates[experimentType as keyof typeof experimentTemplates]();
  chaosInjector.injectFailure(experiment);
  
  res.json({
    message: 'Experiment started',
    experiment
  });
});

app.post('/api/experiments/stop/:id', (req, res) => {
  const { id } = req.params;
  chaosInjector.stopExperiment(id);
  
  res.json({
    message: 'Experiment stopped',
    experimentId: id
  });
});

app.post('/api/emergency-stop', (req, res) => {
  safetyGuardian.emergencyStop();
  res.json({ message: 'Emergency stop executed' });
});

// Test endpoints to simulate services
app.get('/api/timeline', async (req, res) => {
  // Simulate database query
  const dbDelay = chaosInjector.getInjectedDelay('database');
  
  if (chaosInjector.shouldInjectFailure('database')) {
    return res.status(503).json({ error: 'Database unavailable' });
  }

  await new Promise(resolve => setTimeout(resolve, dbDelay + 50));

  // Simulate cache check
  const usedCache = !chaosInjector.shouldInjectFailure('cache');
  
  res.json({
    tweets: [
      { id: 1, content: 'System working normally', timestamp: Date.now() },
      { id: 2, content: 'Chaos testing in progress...', timestamp: Date.now() - 1000 },
      { id: 3, content: 'Resilience validation active', timestamp: Date.now() - 2000 }
    ],
    cached: usedCache,
    latency: dbDelay + 50
  });
});

// Update service health periodically
setInterval(() => {
  const metrics = metricsCollector.getMetrics();
  
  metricsCollector.updateServiceHealth('api', {
    name: 'API',
    status: metrics.errorRate > 5 ? 'degraded' : metrics.errorRate > 1 ? 'degraded' : 'healthy',
    errorRate: metrics.errorRate,
    latency: metrics.latencyP95,
    lastCheck: Date.now()
  });

  metricsCollector.updateServiceHealth('database', {
    name: 'Database',
    status: (global as any).chaosInjections?.database ? 'degraded' : 'healthy',
    errorRate: 0,
    latency: 20,
    lastCheck: Date.now()
  });

  metricsCollector.updateServiceHealth('cache', {
    name: 'Cache',
    status: (global as any).chaosInjections?.cache ? 'down' : 'healthy',
    errorRate: 0,
    latency: 5,
    lastCheck: Date.now()
  });
}, 3000);

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Chaos Engineering Backend running on port ${PORT}`);
  safetyGuardian.startMonitoring();
});

// WebSocket for real-time updates
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  const interval = setInterval(() => {
    const data = {
      metrics: metricsCollector.getMetrics(),
      health: metricsCollector.getSystemHealth(),
      activeExperiments: chaosInjector.getActiveExperiments()
    };
    
    ws.send(JSON.stringify(data));
  }, 1000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('WebSocket client disconnected');
  });
});

process.on('SIGTERM', () => {
  safetyGuardian.stopMonitoring();
  server.close();
});
