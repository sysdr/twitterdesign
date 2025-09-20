import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { SimpleRedisManager } from './redis/SimpleRedisManager';
import { SessionManager } from './session/SessionManager';
import { AuthController } from './controllers/AuthController';
import { SessionController } from './controllers/SessionController';
import { authMiddleware } from './middleware/authMiddleware';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(rateLimitMiddleware);

// Initialize Redis and Session Manager
const redisManager = new SimpleRedisManager();
const sessionManager = new SessionManager(redisManager);
const authController = new AuthController(sessionManager);
const sessionController = new SessionController(sessionManager);

// Routes
app.use('/api/auth', authController.router);
app.use('/api/session', authMiddleware(sessionManager), sessionController.router);

// Health check
app.get('/health', async (req, res) => {
  const redisHealth = await redisManager.healthCheck();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: redisHealth
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
async function startServer() {
  try {
    await redisManager.initialize();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔴 Redis cluster initialized`);
      console.log(`📊 Session management active`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
