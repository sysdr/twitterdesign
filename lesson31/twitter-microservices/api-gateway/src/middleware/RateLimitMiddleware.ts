import rateLimit from 'express-rate-limit';

export const RateLimitMiddleware = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req) => {
    // Higher limits for verified users
    const isVerified = req.user?.verified;
    return isVerified ? 10000 : 1000;
  },
  message: {
    error: 'Rate limit exceeded',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});
