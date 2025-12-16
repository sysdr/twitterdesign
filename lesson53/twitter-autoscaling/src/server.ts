import express from 'express';
import { metricsCollector } from './services/metricsCollector';
import { trafficPredictor } from './services/trafficPredictor';
import { AutoScaler } from './services/autoScaler';
import { AutoScalerConfig } from './models/types';

const app = express();
const PORT = 4000;

const config: AutoScalerConfig = {
  minServers: 2,
  maxServers: 20,
  targetUtilization: 0.70,
  serverCapacity: 250,
  scaleUpThreshold: 0.75,
  scaleDownThreshold: 0.40,
  cooldownPeriod: 180, // 3 minutes
  costPerServerHour: 0.10,
  maxDailyBudget: 50
};

const autoScaler = new AutoScaler(config, metricsCollector, trafficPredictor);

// Start metrics collection
metricsCollector.startCollection(5); // Collect every 5 seconds for demo

// Run auto-scaler every minute
setInterval(async () => {
  await autoScaler.makeScalingDecision();
}, 60000);

app.use(express.json());

app.get('/api/metrics/current', async (_req, res) => {
  const metrics = await metricsCollector.collectMetrics();
  res.json(metrics);
});

app.get('/api/metrics/historical', (req, res) => {
  const hours = parseInt(req.query.hours as string) || 1;
  const metrics = metricsCollector.getHistoricalMetrics(hours);
  res.json(metrics);
});

app.get('/api/servers', (_req, res) => {
  const servers = metricsCollector.getCurrentServers();
  res.json(servers);
});

app.get('/api/prediction', async (_req, res) => {
  const historicalMetrics = metricsCollector.getHistoricalMetrics(1);
  const prediction = await trafficPredictor.predictNextHour(historicalMetrics);
  res.json(prediction);
});

app.get('/api/scaling/history', (_req, res) => {
  const history = autoScaler.getScalingHistory();
  res.json(history);
});

app.get('/api/scaling/config', (_req, res) => {
  const config = autoScaler.getConfig();
  res.json(config);
});

app.post('/api/scaling/manual', async (_req, res) => {
  const decision = await autoScaler.makeScalingDecision();
  res.json(decision);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`✓ API Server running on http://localhost:${PORT}`);
  console.log(`✓ Metrics collection active`);
  console.log(`✓ Auto-scaler running`);
});
