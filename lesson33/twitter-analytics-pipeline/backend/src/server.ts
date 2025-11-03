import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { AnalyticsController } from './controllers/AnalyticsController';
import { StreamProcessor } from './services/StreamProcessor';
import { FeatureStore } from './services/FeatureStore';
import { DataLakeService } from './services/DataLakeService';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize services
const featureStore = new FeatureStore();
const dataLake = new DataLakeService();
const streamProcessor = new StreamProcessor(io, featureStore, dataLake);
const analyticsController = new AnalyticsController(featureStore, dataLake);

// Routes
app.use('/api/analytics', analyticsController.router);

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Analytics backend running on port ${PORT}`);
  console.log(`📊 Processing real-time analytics streams...`);
  
  // Start stream processing
  streamProcessor.start();
});
