import { Request, Response, NextFunction } from 'express';
import rateLimitService from '../services/rateLimitService.js';

export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Bypass rate limiting in development mode
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.log('Rate limiting bypassed for environment:', process.env.NODE_ENV);
    next();
    return;
  }

  // Also bypass if NODE_ENV is not set (assume development)
  if (!process.env.NODE_ENV) {
    console.log('Rate limiting bypassed - NODE_ENV not set');
    next();
    return;
  }

  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = (req as any).user?.userId;

    // Check IP rate limit
    const ipLimit = await rateLimitService.getIPRateLimit(ip);
    if (!ipLimit.allowed) {
      res.status(429).json({
        success: false,
        message: 'Too many requests from this IP',
        retryAfter: ipLimit.resetTime
      });
      return;
    }

    // Check user rate limit if authenticated
    if (userId) {
      const userLimit = await rateLimitService.getUserRateLimit(userId);
      if (!userLimit.allowed) {
        res.status(429).json({
          success: false,
          message: 'User rate limit exceeded',
          retryAfter: userLimit.resetTime
        });
        return;
      }

      // Check endpoint-specific rate limit
      const endpointLimit = await rateLimitService.getEndpointRateLimit(userId, req.path);
      if (!endpointLimit.allowed) {
        res.status(429).json({
          success: false,
          message: 'Endpoint rate limit exceeded',
          retryAfter: endpointLimit.resetTime
        });
        return;
      }
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': ipLimit.remainingRequests.toString(),
      'X-RateLimit-Reset': Math.ceil(ipLimit.resetTime / 1000).toString()
    });

    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    next(); // Continue on rate limiting errors
  }
};
