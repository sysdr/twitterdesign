import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';

import routes from './routes';
import { redis } from './utils/redis';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Performance middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/info', 
      'GET /api/v1/tweets',
      'POST /api/v1/tweets',
      'GET /api/v2/tweets',
      'POST /api/v2/tweets',
      'POST /api/v2/tweets/:id/reactions'
    ]
  });
});

const PORT = process.env.PORT || 3000;

// Graceful startup
async function startServer() {
  try {
    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connection verified');
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Info: http://localhost:${PORT}/api/info`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🐦 Tweets V1: http://localhost:${PORT}/api/v1/tweets`);
      console.log(`🦅 Tweets V2: http://localhost:${PORT}/api/v2/tweets`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    console.log('🔒 HTTP server closed');
    redis.disconnect();
    console.log('🔒 Redis connection closed');
    process.exit(0);
  });
});

startServer();

export default app;
