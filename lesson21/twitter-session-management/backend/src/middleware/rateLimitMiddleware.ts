import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'rl',
  points: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  duration: (Number(process.env.RATE_LIMIT_WINDOW) || 15) * 60, // 15 minutes
});

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await rateLimiter.consume(req.ip || 'unknown');
    next();
  } catch (rateLimiterRes) {
    const secs = Math.round((rateLimiterRes as any).msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: secs
    });
  }
}
