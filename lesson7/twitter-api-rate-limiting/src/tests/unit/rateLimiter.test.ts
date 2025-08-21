import { TokenBucketRateLimiter, getRateLimitConfig } from '../../utils/rateLimiter';
import { redis } from '../../utils/redis';

describe('TokenBucketRateLimiter', () => {
  let rateLimiter: TokenBucketRateLimiter;
  
  beforeEach(() => {
    rateLimiter = new TokenBucketRateLimiter(redis, {
      requests: 10,
      window: 60,
      burst: 5,
      penalty: 30
    });
  });

  test('should allow requests within limit', async () => {
    const result = await rateLimiter.checkLimit('test-key-1');
    
    expect(result.allowed).toBe(true);
    expect(result.info.remaining).toBe(9);
    expect(result.info.limit).toBe(10);
  });

  test('should deny requests when limit exceeded', async () => {
    const key = 'test-key-2';
    
    // Exhaust the bucket
    for (let i = 0; i < 10; i++) {
      await rateLimiter.checkLimit(key);
    }
    
    // This should be denied
    const result = await rateLimiter.checkLimit(key);
    expect(result.allowed).toBe(false);
    expect(result.info.remaining).toBe(0);
  });

  test('should refill tokens over time', async () => {
    const key = 'test-key-3';
    
    // Use all tokens
    for (let i = 0; i < 10; i++) {
      await rateLimiter.checkLimit(key);
    }
    
    // Wait for token refill (simulate time passing)
    const bucketKey = `rate_limit:${key}`;
    const pastTime = Date.now() - 60000; // 60 seconds ago (1 minute)
    await redis.hmset(bucketKey, { lastRefill: pastTime });
    
    const result = await rateLimiter.checkLimit(key);
    expect(result.allowed).toBe(true);
    expect(result.info.remaining).toBeGreaterThan(0);
  });
});

describe('getRateLimitConfig', () => {
  test('should return correct config for basic user', () => {
    const config = getRateLimitConfig('basic', 'GET:/tweets');
    
    expect(config.requests).toBe(100);
    expect(config.window).toBe(900);
  });

  test('should return stricter limits for write operations', () => {
    const readConfig = getRateLimitConfig('basic', 'GET:/tweets');
    const writeConfig = getRateLimitConfig('basic', 'POST:/tweets');
    
    expect(writeConfig.requests).toBeLessThan(readConfig.requests);
  });

  test('should return higher limits for verified users', () => {
    const basicConfig = getRateLimitConfig('basic', 'GET:/tweets');
    const verifiedConfig = getRateLimitConfig('verified', 'GET:/tweets');
    
    expect(verifiedConfig.requests).toBeGreaterThan(basicConfig.requests);
  });
});
