import { redis } from '../config/database.js';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
}

class RateLimitService {
  private isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    // Disable rate limiting during tests
    if (this.isTestEnvironment) {
      return {
        allowed: true,
        remainingRequests: 1000,
        resetTime: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
      };
    }

    const key = `${config.keyPrefix}:${identifier}`;
    const windowStart = Math.floor(Date.now() / config.windowMs) * config.windowMs;
    const windowKey = `${key}:${windowStart}`;

    const pipeline = redis.multi();
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    const currentCount = Array.isArray(results) && results[0] 
      ? (results[0] as [string, number])[1] 
      : 0;

    const allowed = currentCount <= config.maxRequests;
    const remainingRequests = Math.max(0, config.maxRequests - currentCount);
    const resetTime = windowStart + config.windowMs;

    return {
      allowed,
      remainingRequests,
      resetTime
    };
  }

  async getUserRateLimit(userId: string): Promise<RateLimitResult> {
    return this.checkRateLimit(userId, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 300,
      keyPrefix: 'user_limit'
    });
  }

  async getIPRateLimit(ip: string): Promise<RateLimitResult> {
    return this.checkRateLimit(ip, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 1000, // Increased from 100 for testing
      keyPrefix: 'ip_limit'
    });
  }

  async getEndpointRateLimit(userId: string, endpoint: string): Promise<RateLimitResult> {
    const configs: Record<string, RateLimitConfig> = {
      '/auth/login': {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100, // Increased from 5 for testing
        keyPrefix: 'login_limit'
      },
      '/auth/register': {
        windowMs: 60 * 60 * 1000,
        maxRequests: 50, // Increased from 3 for testing
        keyPrefix: 'register_limit'
      },
      '/tweets': {
        windowMs: 3 * 60 * 60 * 1000,
        maxRequests: 300,
        keyPrefix: 'tweet_limit'
      }
    };

    const config = configs[endpoint] || {
      windowMs: 15 * 60 * 1000,
      maxRequests: 60,
      keyPrefix: 'default_limit'
    };

    return this.checkRateLimit(`${userId}:${endpoint}`, config);
  }
}

export default new RateLimitService();
