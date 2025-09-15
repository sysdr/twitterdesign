import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cacheRoutes from './routes/cache';
import analyticsRoutes from './routes/analytics';
import { CacheManager } from './cache/CacheManager';
import { WarmingEngine } from './services/WarmingEngine';
import { MetricsCollector } from './services/MetricsCollector';
import { startCacheWarming } from './services/WarmingScheduler';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize services
const cacheManager = CacheManager.getInstance();
const metricsCollector = MetricsCollector.getInstance();
const warmingEngine = new WarmingEngine(cacheManager);

// Routes
app.use('/api/cache', cacheRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', async (req, res) => {
  const health = await cacheManager.getHealthStatus();
  res.json({ status: 'ok', timestamp: new Date().toISOString(), cache: health });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  const metrics = await metricsCollector.getPrometheusMetrics();
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// Real-time metrics via WebSocket
io.on('connection', (socket) => {
  console.log('Client connected for real-time metrics');
  
  const metricsInterval = setInterval(async () => {
    const metrics = await metricsCollector.getRealTimeMetrics();
    socket.emit('metrics', metrics);
  }, 1000);

  socket.on('disconnect', () => {
    clearInterval(metricsInterval);
    console.log('Client disconnected');
  });
});

server.listen(PORT, async () => {
  console.log(`🚀 Distributed Cache Server running on port ${PORT}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  
  // Wait for cache nodes to be ready before starting warming
  console.log('⏳ Waiting for cache nodes to be ready...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Initialize cache warming after nodes are ready
  startCacheWarming(warmingEngine);
});

export { app, cacheManager };
