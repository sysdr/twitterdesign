import express from 'express';
import { getTweets, createTweet, getTweet } from '../../controllers/v1/tweets';
import { authenticateToken, optionalAuth } from '../../middleware/auth';
import { rateLimit, createEndpointRateLimit } from '../../middleware/rateLimiter';

const router = express.Router();

// Public endpoints with optional auth
router.get('/', optionalAuth as any, rateLimit as any, getTweets);
router.get('/:id', optionalAuth as any, rateLimit as any, getTweet);

// Protected endpoints
router.post('/', 
  authenticateToken as any,
  createEndpointRateLimit({ requests: 10, window: 60 }) as any, // Stricter limit for writes
  rateLimit as any, 
  createTweet
);

export default router;
