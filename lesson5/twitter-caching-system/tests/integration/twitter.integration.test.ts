import request from 'supertest';
import express from 'express';
import { CacheManager } from '../../src/cache/CacheManager';
import { TwitterService } from '../../src/services/TwitterService';
import { MetricsService } from '../../src/services/MetricsService';
import { Logger } from '../../src/utils/Logger';

// Create a test app instance
const app = express();
const PORT = 3001; // Use different port for tests

// Initialize services
const cacheManager = new CacheManager();
const twitterService = new TwitterService(cacheManager);
const metricsService = new MetricsService();
const logger = Logger.getInstance();

// Middleware
app.use(express.json({ limit: '10mb' }));

// Routes
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

// Initialize cache manager before tests
beforeAll(async () => {
  await cacheManager.initialize();
});

// Clear cache before each test
beforeEach(async () => {
  await cacheManager.invalidate('timeline');
  await cacheManager.invalidate('trending');
});

// Cleanup after tests
afterAll(async () => {
  await cacheManager.shutdown();
});

describe('Twitter API Integration Tests', () => {
  test('GET /api/users/:userId/timeline should return cached timeline', async () => {
    const response = await request(app)
      .get('/api/users/user1/timeline')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.tweets).toBeDefined();
    expect(response.body.data.cached).toBe(false); // First request
    expect(response.body.cache_hit_rate).toBeDefined();
  });

  test('POST /api/tweets should create tweet and invalidate cache', async () => {
    const tweetData = {
      userId: 'user1',
      content: 'Test tweet for integration testing',
      mediaUrls: []
    };

    const response = await request(app)
      .post('/api/tweets')
      .send(tweetData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toBe(tweetData.content);
  });

  test('GET /api/trending should return trending topics', async () => {
    const response = await request(app)
      .get('/api/trending')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.topics).toBeDefined();
    expect(Array.isArray(response.body.data.topics)).toBe(true);
  });

  test('GET /api/cache/stats should return cache statistics', async () => {
    const response = await request(app)
      .get('/api/cache/stats')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.l1).toBeDefined();
    expect(response.body.data.l2).toBeDefined();
    expect(response.body.data.overall).toBeDefined();
  });

  test('Cache should improve performance on repeated requests', async () => {
    const start1 = Date.now();
    await request(app).get('/api/users/user1/timeline');
    const duration1 = Date.now() - start1;

    const start2 = Date.now();
    const response2 = await request(app).get('/api/users/user1/timeline');
    const duration2 = Date.now() - start2;

    expect(response2.body.data.cached).toBe(true);
    expect(duration2).toBeLessThan(duration1);
  });
});
