import express from 'express';
// @ts-ignore
import { Server } from 'ws';
import { MetricsCollector } from './collectors/MetricsCollector';
import { PerformanceAnalyzer } from './analyzers/PerformanceAnalyzer';
import { TestOrchestrator } from './orchestrator/TestOrchestrator';
import { OptimizationEngine } from './optimizer/OptimizationEngine';

const app = express();
const port = 4000;

app.use(express.json());

// Initialize components
const collector = new MetricsCollector();
const analyzer = new PerformanceAnalyzer(collector);
const orchestrator = new TestOrchestrator(collector, analyzer);
const optimizer = new OptimizationEngine();

// Store test results
let testResults: any[] = [];
let optimizations: any[] = [];

// WebSocket for real-time updates
const wss = new Server({ port: 4001 });

wss.on('connection', (ws: any) => {
  console.log('WebSocket client connected');
  
  // Send current data
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      testResults,
      optimizations,
      metrics: collector.getRecentMetrics()
    }
  }));
});

function broadcast(data: any) {
  wss.clients.forEach((client: any) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

// API endpoints
app.get('/api/metrics', (req, res) => {
  const metrics = collector.getRecentMetrics();
  res.json({ metrics });
});

app.get('/api/metrics/summary', (req, res) => {
  const metrics = collector.getRecentMetrics();
  const summary = {
    totalMetrics: metrics.length,
    avgLatency: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length,
    metricTypes: [...new Set(metrics.map(m => m.name))]
  };
  res.json(summary);
});

app.post('/api/test/run', async (req, res) => {
  const { name, concurrentUsers, duration } = req.body;
  
  const config = {
    name: name || 'Custom Test',
    concurrentUsers: concurrentUsers || 500,
    duration: duration || 60,
    endpoints: ['api.tweet.create', 'api.timeline.fetch', 'db.query.user'],
    rampUp: 30
  };

  try {
    const result = await orchestrator.runTest(config);
    testResults.push(result);
    
    broadcast({
      type: 'testComplete',
      data: result
    });
    
    // Analyze bottlenecks
    const recentMetrics = collector.getRecentMetrics();
    const bottlenecks = analyzer.analyzeBottlenecks(recentMetrics);
    
    // Generate optimizations
    const newOptimizations = optimizer.generateOptimizations(bottlenecks);
    optimizations = newOptimizations;
    
    broadcast({
      type: 'optimizations',
      data: newOptimizations
    });

    res.json({ success: true, result, bottlenecks, optimizations: newOptimizations });
  } catch (error) {
    res.status(500).json({ error: 'Test execution failed' });
  }
});

app.post('/api/test/suite', async (req, res) => {
  try {
    const results = await orchestrator.runTestSuite();
    testResults = results;
    
    broadcast({
      type: 'suiteComplete',
      data: results
    });

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: 'Test suite execution failed' });
  }
});

app.get('/api/optimizations', (req, res) => {
  res.json({ optimizations });
});

app.post('/api/optimizations/:id/apply', (req, res) => {
  const { id } = req.params;
  const optimization = optimizations.find(o => o.id === id);
  
  if (!optimization) {
    return res.status(404).json({ error: 'Optimization not found' });
  }

  const applied = optimizer.applyOptimization(optimization);
  
  broadcast({
    type: 'optimizationApplied',
    data: { id, applied }
  });

  res.json({ success: applied, optimization });
});

app.get('/api/budgets', (req, res) => {
  const budgets = [
    { endpoint: 'api.tweet.create', p50: 30, p95: 50, p99: 75 },
    { endpoint: 'api.timeline.fetch', p50: 20, p95: 30, p99: 50 },
    { endpoint: 'db.query.user', p50: 5, p95: 10, p99: 20 },
    { endpoint: 'cache.operation', p50: 2, p95: 5, p99: 10 }
  ];
  res.json({ budgets });
});

app.get('/api/regressions', (req, res) => {
  // Simulate regression detection
  const regressions: any[] = [];
  res.json({ regressions });
});

// Simulate continuous metrics collection
setInterval(() => {
  // Simulate API calls
  const endpoints = ['api.tweet.create', 'api.timeline.fetch', 'db.query.user', 'cache.operation'];
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  let latency = 20 + Math.random() * 30;
  if (endpoint.includes('db')) latency = 5 + Math.random() * 10;
  if (endpoint.includes('cache')) latency = 2 + Math.random() * 5;
  
  collector.recordTiming(endpoint, latency);
  
  // Broadcast current metrics
  if (Math.random() < 0.1) { // 10% of the time
    const recent = collector.getRecentMetrics(10000);
    broadcast({
      type: 'metrics',
      data: recent.slice(-50) // Last 50 metrics
    });
  }
}, 100);

app.listen(port, () => {
  console.log(`Performance Engineering API running on http://localhost:${port}`);
  console.log(`WebSocket server running on ws://localhost:4001`);
  console.log('\nAvailable endpoints:');
  console.log('  GET  /api/metrics');
  console.log('  GET  /api/metrics/summary');
  console.log('  POST /api/test/run');
  console.log('  POST /api/test/suite');
  console.log('  GET  /api/optimizations');
  console.log('  POST /api/optimizations/:id/apply');
  console.log('  GET  /api/budgets');
  console.log('  GET  /api/regressions');
});
