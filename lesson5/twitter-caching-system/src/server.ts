import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import { CacheManager } from './cache/CacheManager';
import { TwitterService } from './services/TwitterService';
import { MetricsService } from './services/MetricsService';
import { Logger } from './utils/Logger';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const cacheManager = new CacheManager();
const twitterService = new TwitterService(cacheManager);
const metricsService = new MetricsService();
const logger = Logger.getInstance();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsService.recordRequestDuration(req.method, req.route?.path || req.path, duration);
  });
  next();
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/metrics', async (req, res) => {
  const metrics = await metricsService.getMetrics();
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// User timeline endpoint with caching
app.get('/api/users/:userId/timeline', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const timeline = await twitterService.getUserTimeline(
      userId, 
      Number(page), 
      Number(limit)
    );
    
    res.json({
      success: true,
      data: timeline,
      cached: timeline.cached,
      cache_hit_rate: await cacheManager.getHitRate()
    });
  } catch (error) {
    logger.error('Timeline fetch error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Tweet creation with cache invalidation
app.post('/api/tweets', async (req, res) => {
  try {
    const { userId, content, mediaUrls } = req.body;
    
    const tweet = await twitterService.createTweet({
      userId,
      content,
      mediaUrls: mediaUrls || []
    });
    
    res.status(201).json({
      success: true,
      data: tweet
    });
  } catch (error) {
    logger.error('Tweet creation error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get trending topics
app.get('/api/trending', async (req, res) => {
  try {
    const trending = await twitterService.getTrendingTopics();
    res.json({
      success: true,
      data: trending,
      cached: trending.cached
    });
  } catch (error) {
    logger.error('Trending topics error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Cache statistics dashboard
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await cacheManager.getStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Cache stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Start server
async function startServer() {
  try {
    await cacheManager.initialize();
    logger.info('Cache manager initialized');
    
    app.listen(PORT, () => {
      logger.info(`🚀 Twitter Caching System running on port ${PORT}`);
      logger.info(`📊 Metrics available at http://localhost:${PORT}/metrics`);
      logger.info(`📈 Cache stats at http://localhost:${PORT}/api/cache/stats`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app };
