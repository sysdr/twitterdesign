import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Performance monitoring endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const { query } = require('./config/database');
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const tweetCount = await query('SELECT COUNT(*) as count FROM tweets');
    const followCount = await query('SELECT COUNT(*) as count FROM user_follows');
    
    res.json({
      users: parseInt(userCount.rows[0].count),
      tweets: parseInt(tweetCount.rows[0].count),
      relationships: parseInt(followCount.rows[0].count),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Stats endpoint error:', error);
    res.status(500).json({ 
      error: error.message || 'Database connection failed',
      details: 'Database is not available. Please ensure PostgreSQL is running and migrations are complete.',
      status: 'database_unavailable'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
