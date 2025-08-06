import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { redis } from './services/redis.js';
import { db } from './services/database.js';
import { setupDatabase, seedDatabase } from './utils/setupDatabase.js';
import { getTimeline, postTweet } from './controllers/timelineController.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Mock auth middleware for demo
app.use(async (req: any, res, next) => {
  // Get demo_user ID from database
  try {
    const result = await db.query('SELECT id FROM users WHERE username = $1', ['demo_user']);
    if (result.rows.length > 0) {
      req.user = { id: result.rows[0].id };
    } else {
      req.user = { id: 'demo-user' }; // fallback
    }
  } catch (error) {
    req.user = { id: 'demo-user' }; // fallback
  }
  next();
});

// Routes
app.get('/api/timeline', getTimeline);
app.post('/api/tweets', postTweet);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    // Connect to Redis
    await redis.connect();
    console.log('✅ Redis connected');
    
    // Setup database
    await setupDatabase();
    console.log('✅ Database setup complete');
    
    // Seed with demo data
    await seedDatabase();
    console.log('✅ Database seeded');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Timeline API: http://localhost:${PORT}/api/timeline`);
      console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
