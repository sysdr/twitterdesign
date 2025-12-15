const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const cron = require('node-cron');

const healthCheckService = require('./services/healthCheck');
const backupService = require('./services/backupService');
const failoverController = require('./services/failoverController');
const drTester = require('./services/drTester');
const metricsCollector = require('./services/metricsCollector');
const backupModel = require('./models/backup');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  logger.info('Client connected to WebSocket');
  
  ws.on('close', () => {
    clients.delete(ws);
    logger.info('Client disconnected from WebSocket');
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Health Check API
app.get('/api/health', async (req, res) => {
  try {
    const health = await healthCheckService.runChecks();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health/metrics', (req, res) => {
  const metrics = healthCheckService.getMetrics();
  res.json(metrics);
});

// Backup API
app.post('/api/backup/full', async (req, res) => {
  try {
    const backup = await backupService.createFullBackup();
    broadcast({ type: 'backup', data: backup });
    res.json(backup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/backup/incremental', async (req, res) => {
  try {
    const backup = await backupService.createIncrementalBackup();
    broadcast({ type: 'backup', data: backup });
    res.json(backup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/backup/list', (req, res) => {
  const backups = backupModel.getAll();
  res.json(backups);
});

app.get('/api/backup/stats', (req, res) => {
  const stats = backupService.getStats();
  res.json(stats);
});

// Failover API
app.post('/api/failover/initiate', async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await failoverController.initiateFailover(reason || 'Manual trigger');
    broadcast({ type: 'failover', data: result });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/failover/failback', async (req, res) => {
  try {
    const result = await failoverController.failback();
    broadcast({ type: 'failback', data: result });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/failover/status', (req, res) => {
  const status = failoverController.getStatus();
  res.json(status);
});

// DR Testing API
app.post('/api/dr-test/run', async (req, res) => {
  try {
    const result = await drTester.runDRDrill();
    broadcast({ type: 'dr-test', data: result });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dr-test/history', (req, res) => {
  const history = drTester.getTestHistory();
  res.json(history);
});

// Metrics API
app.get('/api/metrics', (req, res) => {
  const metrics = metricsCollector.getMetrics();
  res.json(metrics);
});

// Dashboard data
app.get('/api/dashboard', async (req, res) => {
  try {
    const health = await healthCheckService.runChecks();
    const backupStats = backupService.getStats();
    const failoverStatus = failoverController.getStatus();
    const drTestHistory = drTester.getTestHistory();
    const metrics = metricsCollector.getMetrics();

    res.json({
      health,
      backupStats,
      failoverStatus,
      drTestHistory,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scheduled tasks
// Full backup every 4 hours
cron.schedule('0 */4 * * *', async () => {
  logger.info('Running scheduled full backup');
  await backupService.createFullBackup();
});

// Incremental backup every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  logger.info('Running scheduled incremental backup');
  await backupService.createIncrementalBackup();
});

// WAL backup every 30 seconds
cron.schedule('*/30 * * * * *', async () => {
  await backupService.createWALBackup();
});

// Health checks every 10 seconds
cron.schedule('*/10 * * * * *', async () => {
  const health = await healthCheckService.runChecks();
  broadcast({ type: 'health', data: health });
  
  // Auto-failover if needed
  if (health.state === 'FAILING_OVER' && 
      failoverController.state !== 'FAILING_OVER') {
    logger.warn('Auto-initiating failover due to health check failure');
    await failoverController.initiateFailover('Automatic - Primary unhealthy');
  }
});

// Simulate traffic for metrics
setInterval(() => {
  const latency = 30 + Math.random() * 40; // 30-70ms
  const success = Math.random() > 0.001; // 99.9% success rate
  metricsCollector.recordRequest(latency, success);
}, 100);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`🚀 DR Automation Backend running on port ${PORT}`);
  logger.info(`📊 Dashboard: http://localhost:3000`);
  logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
  logger.info('');
  logger.info('🔧 Scheduled Tasks:');
  logger.info('   - Full backup: Every 4 hours');
  logger.info('   - Incremental backup: Every 5 minutes');
  logger.info('   - WAL backup: Every 30 seconds');
  logger.info('   - Health checks: Every 10 seconds');
});
