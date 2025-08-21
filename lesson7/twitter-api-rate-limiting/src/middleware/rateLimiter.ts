import { Request, Response, NextFunction } from 'express';
import { TokenBucketRateLimiter, getRateLimitConfig } from '../utils/rateLimiter';
import { redis } from '../utils/redis';
import { AuthenticatedRequest } from '../types';

const rateLimiter = new TokenBucketRateLimiter(redis, {
  requests: 100,
  window: 900,
  burst: 10,
  penalty: 300
});

export const rateLimit = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const userTier = user?.tier || 'basic';
    const endpoint = `${req.method}:${(req as any).route?.path || req.path}`;
    
    // Create unique key for user and endpoint
    const limitKey = `${user?.id || (req as any).ip || 'unknown'}:${endpoint}`;
    
    // Get rate limit config based on user tier and endpoint
    const config = getRateLimitConfig(userTier, endpoint);
    const limiter = new TokenBucketRateLimiter(redis, config);
    
    // Check rate limit
    const result = await limiter.checkLimit(limitKey);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': config.requests.toString(),
      'X-RateLimit-Remaining': result.info.remaining.toString(),
      'X-RateLimit-Reset': result.info.resetTime.toString(),
      'X-RateLimit-Window': config.window.toString()
    });
    
    if (!result.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Try again after ${new Date(result.info.resetTime * 1000).toISOString()}`,
        meta: {
          rateLimitInfo: result.info
        }
      });
    }
    
    // Attach rate limit info to request
    req.rateLimitInfo = result.info;
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - allow request if rate limiting fails
    next();
  }
};

export const createEndpointRateLimit = (config: Partial<{ requests: number; window: number }>) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const limitKey = `endpoint:${(req as any).ip || 'unknown'}:${req.path}`;
    const limiter = new TokenBucketRateLimiter(redis, {
      requests: config.requests || 60,
      window: config.window || 60,
      burst: 10,
      penalty: 60
    });
    
    const result = await limiter.checkLimit(limitKey);
    
    if (!result.allowed) {
      return res.status(429).json({
        error: 'Endpoint rate limit exceeded',
        message: 'Too many requests to this endpoint'
      });
    }
    
    next();
  };
};
