import express from 'express';
import { getTweets, createTweet, reactToTweet } from '../../controllers/v2/tweets';
import { authenticateToken, optionalAuth } from '../../middleware/auth';
import { rateLimit, createEndpointRateLimit } from '../../middleware/rateLimiter';

const router = express.Router();

// Public endpoints with optional auth
router.get('/', optionalAuth as any, rateLimit as any, getTweets);

// Protected endpoints
router.post('/', 
  authenticateToken as any,
  createEndpointRateLimit({ requests: 15, window: 60 }) as any, // Slightly higher limit for v2
  rateLimit as any, 
  createTweet
);

router.post('/:id/reactions', 
  authenticateToken as any,
  createEndpointRateLimit({ requests: 30, window: 60 }) as any, // Higher limit for reactions
  rateLimit as any,
  reactToTweet
);

export default router;
