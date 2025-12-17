import Redis from 'ioredis';
import { SecurityEvent } from '../models/SecurityEvent';

export class RateLimitDetector {
  private redis: Redis;
  private readonly WINDOW_SIZE = 60000; // 60 seconds
  private readonly MAX_REQUESTS = 100;
  private readonly MAX_FAILED_AUTH = 5;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    });
  }

  async analyze(event: SecurityEvent): Promise<{ score: number; reason: string }> {
    const key = `rate:${event.ipAddress}:${event.eventType}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.pexpire(key, this.WINDOW_SIZE);
    }

    // Special handling for authentication failures
    if (event.eventType === 'AUTH' && event.outcome === 'FAILURE') {
      const authKey = `auth_failures:${event.ipAddress}`;
      const failures = await this.redis.incr(authKey);
      
      if (failures === 1) {
        await this.redis.pexpire(authKey, this.WINDOW_SIZE);
      }

      if (failures >= this.MAX_FAILED_AUTH) {
        return {
          score: 0.95,
          reason: `Brute force detected: ${failures} failed login attempts`
        };
      }
    }

    // General rate limiting
    const threshold = event.eventType === 'AUTH' ? 20 : this.MAX_REQUESTS;
    const ratio = count / threshold;

    if (ratio >= 1.5) {
      return {
        score: 0.90,
        reason: `Rate limit exceeded: ${count} requests in 60s (max: ${threshold})`
      };
    } else if (ratio >= 1.0) {
      return {
        score: 0.70,
        reason: `High request rate: ${count} requests approaching limit`
      };
    }

    return { score: Math.min(ratio * 0.5, 0.5), reason: 'Normal request rate' };
  }

  async cleanup(): Promise<void> {
    await this.redis.quit();
  }
}
