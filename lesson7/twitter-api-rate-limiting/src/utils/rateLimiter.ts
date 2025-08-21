import Redis from 'ioredis';
import { RateLimitConfig, RateLimitInfo } from '../types';

export class TokenBucketRateLimiter {
  private redis: Redis;
  private config: RateLimitConfig;

  constructor(redis: Redis, config: RateLimitConfig) {
    this.redis = redis;
    this.config = config;
  }

  async checkLimit(key: string): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const bucketKey = `rate_limit:${key}`;
    const now = Date.now();
    
    // Get current bucket state
    const pipeline = this.redis.pipeline();
    pipeline.hmget(bucketKey, 'tokens', 'lastRefill');
    pipeline.expire(bucketKey, this.config.window * 2);
    
    const results = await pipeline.exec();
    const [tokens, lastRefill] = results![0][1] as string[];
    
    // Initialize bucket if not exists
    let currentTokens = tokens ? parseInt(tokens) : this.config.requests;
    let lastRefillTime = lastRefill ? parseInt(lastRefill) : now;
    
    // Calculate tokens to add based on time elapsed
    const timePassed = (now - lastRefillTime) / 1000;
    const tokensToAdd = Math.floor(timePassed * (this.config.requests / this.config.window));
    
    // Refill bucket (capped at max capacity)
    currentTokens = Math.min(this.config.requests, currentTokens + tokensToAdd);
    
    const allowed = currentTokens > 0;
    
    if (allowed) {
      currentTokens -= 1;
    }
    
    // Update bucket state
    await this.redis.hmset(bucketKey, {
      tokens: currentTokens,
      lastRefill: now
    });
    
    const resetTime = now + ((this.config.requests - currentTokens) * (this.config.window * 1000 / this.config.requests));
    
    return {
      allowed,
      info: {
        remaining: Math.max(0, currentTokens),
        resetTime: Math.ceil(resetTime / 1000),
        limit: this.config.requests
      }
    };
  }

  async getRemainingTokens(key: string): Promise<RateLimitInfo> {
    const result = await this.checkLimit(key);
    return result.info;
  }
}

export const getRateLimitConfig = (userTier: string, endpoint: string): RateLimitConfig => {
  const baseConfig = {
    basic: { requests: 100, window: 900, burst: 10, penalty: 300 },
    premium: { requests: 300, window: 900, burst: 30, penalty: 60 },
    verified: { requests: 1000, window: 900, burst: 100, penalty: 30 }
  };

  const multipliers = {
    read: 1,
    write: 0.3,
    search: 0.5
  };

  const config = baseConfig[userTier as keyof typeof baseConfig] || baseConfig.basic;
  const multiplier = endpoint.includes('POST') ? multipliers.write : 
                   endpoint.includes('search') ? multipliers.search : multipliers.read;

  return {
    ...config,
    requests: Math.floor(config.requests * multiplier)
  };
};
