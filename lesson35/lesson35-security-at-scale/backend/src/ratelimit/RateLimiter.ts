import Redis from 'ioredis';

export interface TokenBucketConfig {
  capacity: number;
  refillRate: number; // tokens per second
}

export class RateLimiter {
  private redis: Redis;
  private defaultConfig: TokenBucketConfig;

  constructor(redis: Redis, defaultConfig: TokenBucketConfig = { capacity: 100, refillRate: 10 }) {
    this.redis = redis;
    this.defaultConfig = defaultConfig;
  }

  async checkLimit(key: string, cost: number = 1, config?: TokenBucketConfig): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const { capacity, refillRate } = config || this.defaultConfig;
    const now = Date.now();
    const bucketKey = `ratelimit:${key}`;

    // Get current bucket state
    const bucketData = await this.redis.get(bucketKey);
    
    let tokens: number;
    let lastRefillTime: number;

    if (bucketData) {
      const parsed = JSON.parse(bucketData);
      tokens = parsed.tokens;
      lastRefillTime = parsed.lastRefillTime;

      // Refill tokens based on time elapsed
      const timeElapsed = (now - lastRefillTime) / 1000; // seconds
      const tokensToAdd = timeElapsed * refillRate;
      tokens = Math.min(capacity, tokens + tokensToAdd);
    } else {
      tokens = capacity;
      lastRefillTime = now;
    }

    // Check if enough tokens
    const allowed = tokens >= cost;
    
    if (allowed) {
      tokens -= cost;
    }

    // Update bucket
    await this.redis.setex(
      bucketKey,
      3600, // 1 hour TTL
      JSON.stringify({ tokens, lastRefillTime: now })
    );

    const resetAt = now + ((capacity - tokens) / refillRate) * 1000;

    return {
      allowed,
      remaining: Math.floor(tokens),
      resetAt
    };
  }

  async checkIPLimit(ipAddress: string): Promise<{ allowed: boolean; remaining: number }> {
    const result = await this.checkLimit(`ip:${ipAddress}`, 1, { capacity: 50, refillRate: 5 });
    return { allowed: result.allowed, remaining: result.remaining };
  }

  async checkUserLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
    const result = await this.checkLimit(`user:${userId}`, 1, { capacity: 100, refillRate: 10 });
    return { allowed: result.allowed, remaining: result.remaining };
  }

  async checkEndpointLimit(userId: string, endpoint: string): Promise<{ allowed: boolean; remaining: number }> {
    const result = await this.checkLimit(`user:${userId}:${endpoint}`, 1, { capacity: 20, refillRate: 2 });
    return { allowed: result.allowed, remaining: result.remaining };
  }
}
