import request from 'supertest';
import app from '../../server';
import { generateToken } from '../../middleware/auth';
import { TokenBucketRateLimiter } from '../../utils/rateLimiter';
import { redis } from '../../utils/redis';

describe('API Integration Tests', () => {
  const validToken = generateToken('1'); // User ID 1
  
  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
        
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('GET /api/info', () => {
    test('should return API information', async () => {
      const response = await request(app)
        .get('/api/info')
        .expect(200);
        
      expect(response.body.name).toBe('Twitter API Clone');
      expect(response.body.versions).toContain('v1');
      expect(response.body.versions).toContain('v2');
    });
  });

  describe('GET /api/v1/tweets', () => {
    test('should return tweets without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/tweets')
        .expect(200);
        
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/v1/tweets')
        .expect(200);
        
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  describe('POST /api/v1/tweets', () => {
    test('should create tweet with valid authentication', async () => {
      const tweetData = {
        content: 'Test tweet from integration test'
      };

      const response = await request(app)
        .post('/api/v1/tweets')
        .set('Authorization', `Bearer ${validToken}`)
        .send(tweetData)
        .expect(201);
        
      expect(response.body.data.content).toBe(tweetData.content);
      expect(response.body.data.id).toBeDefined();
    });

    test('should reject tweet without authentication', async () => {
      const tweetData = {
        content: 'Unauthorized tweet'
      };

      await request(app)
        .post('/api/v1/tweets')
        .send(tweetData)
        .expect(401);
    });

    test('should reject invalid tweet content', async () => {
      const tweetData = {
        content: 'x'.repeat(281) // Exceeds 280 character limit
      };

      await request(app)
        .post('/api/v1/tweets')
        .set('Authorization', `Bearer ${validToken}`)
        .send(tweetData)
        .expect(400);
    });
  });

  describe('GET /api/v2/tweets', () => {
    test('should return enhanced tweets for v2', async () => {
      const response = await request(app)
        .get('/api/v2/tweets')
        .expect(200);
        
      expect(response.body.data).toBeDefined();
      expect(response.headers['x-api-version']).toBe('v2');
    });
  });

  describe('POST /api/v2/tweets/:id/reactions', () => {
    test('should add reaction to tweet', async () => {
      // First get a tweet ID
      const tweetsResponse = await request(app)
        .get('/api/v2/tweets')
        .expect(200);
        
      const tweetId = tweetsResponse.body.data[0].id;
      
      const response = await request(app)
        .post(`/api/v2/tweets/${tweetId}/reactions`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ reaction: 'like' })
        .expect(200);
        
      expect(response.body.data.reactions).toBeDefined();
      expect(response.body.data.reactions.like).toBeGreaterThan(0);
    });
  });

  describe('Rate Limiting', () => {
    test('should include rate limiting headers', async () => {
      const response = await request(app)
        .get('/api/v1/tweets')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
      
      // Verify that rate limiting headers are present
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
      expect(response.headers['x-ratelimit-window']).toBeDefined();
      
      // Verify the values are reasonable
      const limit = parseInt(response.headers['x-ratelimit-limit']);
      const remaining = parseInt(response.headers['x-ratelimit-remaining']);
      const window = parseInt(response.headers['x-ratelimit-window']);
      
      expect(limit).toBeGreaterThan(0);
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(remaining).toBeLessThanOrEqual(limit);
      expect(window).toBeGreaterThan(0);
    });
  });

  describe('API Versioning', () => {
    test('should handle version in URL path', async () => {
      const response = await request(app)
        .get('/api/v1/tweets')
        .expect(200);
        
      expect(response.headers['x-api-version']).toBe('v1');
    });

    test('should handle version in Accept header', async () => {
      const response = await request(app)
        .get('/api/tweets')
        .set('Accept', 'application/vnd.twitter.v2+json')
        .expect(404); // Route doesn't exist without version prefix
    });
  });
});
