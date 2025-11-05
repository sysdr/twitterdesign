import express from 'express';
import cors from 'cors';
import { compressionMiddleware } from './middleware/compression.middleware';
import { MetricsMiddleware } from './middleware/metrics.middleware';
import { DatabaseService } from './services/database.service';
import { DeltaSyncService } from './services/delta-sync.service';
import { PushService } from './services/push.service';
import { BatchService } from './services/batch.service';
import { createApiRoutes } from './routes/api.routes';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const PORT = Number(process.env.PORT) || 3001;

// Initialize services
const db = new DatabaseService();
const deltaSync = new DeltaSyncService(db);
const pushService = new PushService(db);
const batchService = new BatchService();
const metrics = new MetricsMiddleware();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(compressionMiddleware);
app.use(metrics.track);

// Routes
app.use('/api', createApiRoutes(db, deltaSync, pushService, batchService));

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(metrics.getStats());
});

// Create HTTP server
const server = createServer(app);

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected');
  
  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }
  }, 30000);
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'pong') {
        console.log('[WebSocket] Received pong');
      }
    } catch (error) {
      console.error('[WebSocket] Invalid message:', error);
    }
  });
  
  ws.on('close', () => {
    clearInterval(heartbeat);
    console.log('[WebSocket] Client disconnected');
  });
});

// Simulate real-time tweet creation
setInterval(() => {
  const tweet = db.createTweet({
    content: `Real-time tweet at ${new Date().toISOString()}`,
    authorId: 'system',
    authorName: 'System',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    likesCount: 0,
    retweetsCount: 0,
    repliesCount: 0
  });
  
  // Broadcast to all connected clients
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify({
        type: 'new_tweet',
        data: tweet
      }));
    }
  });
}, 60000); // Every minute

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Mobile API Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  console.log(`🔌 WebSocket server at ws://localhost:${PORT}/ws`);
  console.log(`${'='.repeat(60)}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});
