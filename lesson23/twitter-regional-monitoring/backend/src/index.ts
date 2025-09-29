import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import winston from 'winston';
import { RegionalCollector } from './collectors/RegionalCollector';
import { GlobalAggregator } from './aggregator/GlobalAggregator';
import { AlertEngine } from './alerts/AlertEngine';
import { SocketServer } from './websocket/SocketServer';

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Initialize monitoring components
const globalAggregator = new GlobalAggregator();
const alertEngine = new AlertEngine();
const socketServer = new SocketServer(server);

// Regional collectors
const regions = ['us-east', 'europe', 'asia-pacific'];
const collectors: RegionalCollector[] = [];

regions.forEach(regionId => {
  const collector = new RegionalCollector(regionId);
  collectors.push(collector);
  
  collector.on('metrics', (metrics) => {
    globalAggregator.addMetrics(metrics);
  });
  
  collector.startCollection();
});

// Event handlers
globalAggregator.on('systemStateUpdate', (systemState) => {
  alertEngine.evaluateSystemState(systemState);
  socketServer.broadcastSystemState(systemState);
});

alertEngine.on('newAlerts', (alerts) => {
  socketServer.broadcastNewAlerts(alerts);
  logger.info(`🚨 New alerts generated: ${alerts.length}`);
});

alertEngine.on('alertsResolved', (alerts) => {
  socketServer.broadcastAlertsResolved(alerts);
  logger.info(`✅ Alerts resolved: ${alerts.length}`);
});

alertEngine.on('alertAcknowledged', (alert) => {
  socketServer.broadcastAlertAcknowledged(alert);
  logger.info(`👤 Alert acknowledged: ${alert.id}`);
});

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

app.get('/api/system-state', (req, res) => {
  res.json(globalAggregator.getSystemState());
});

app.get('/api/alerts', (req, res) => {
  res.json(alertEngine.getActiveAlerts());
});

app.post('/api/alerts/:id/acknowledge', (req, res) => {
  const { id } = req.params;
  const { userId = 'anonymous' } = req.body;
  
  const success = alertEngine.acknowledgeAlert(id, userId);
  if (success) {
    res.json({ message: 'Alert acknowledged' });
  } else {
    res.status(404).json({ error: 'Alert not found' });
  }
});

// Simulate regional issues for testing
app.post('/api/simulate-issue', (req, res) => {
  const { regionIndex = 0, severity = 'minor' } = req.body;
  
  if (collectors[regionIndex]) {
    collectors[regionIndex].simulateIssue(severity);
    res.json({ message: `Simulated ${severity} issue in region ${regionIndex}` });
  } else {
    res.status(400).json({ error: 'Invalid region index' });
  }
});

app.post('/api/reset-regions', (req, res) => {
  collectors.forEach(collector => collector.resetToNormal());
  res.json({ message: 'All regions reset to normal' });
});

server.listen(PORT, () => {
  logger.info(`🚀 Regional monitoring server running on port ${PORT}`);
  logger.info(`📊 Monitoring ${regions.length} regions: ${regions.join(', ')}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('🛑 Shutting down monitoring server...');
  collectors.forEach(collector => collector.stopCollection());
  server.close();
  process.exit(0);
});
