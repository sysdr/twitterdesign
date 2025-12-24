import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { DataPipelineOrchestrator } from './core/orchestrator.js';
import { MetricsCollector } from './monitoring/metrics.js';
import { setupRoutes } from './api/routes.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// Initialize core systems
const orchestrator = new DataPipelineOrchestrator();
const metrics = new MetricsCollector();

// Setup REST API
setupRoutes(app, orchestrator, metrics);

// WebSocket for real-time metrics
wss.on('connection', (ws) => {
  const interval = setInterval(() => {
    // Update metrics from orchestrator before sending
    metrics.update(
      orchestrator.metrics,
      orchestrator.validator,
      orchestrator.recovery,
      orchestrator.storage
    );
    ws.send(JSON.stringify(metrics.getSnapshot()));
  }, 1000);
  
  ws.on('close', () => clearInterval(interval));
});

// Start pipeline processing
await orchestrator.start();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Data Pipeline API running on port ${PORT}`);
  console.log(`📊 WebSocket metrics available at ws://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  await orchestrator.shutdown();
  process.exit(0);
});
