import { createClient, RedisClientType } from 'redis';

export class CacheManager {
  private client: RedisClientType;
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0
  };

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
    
    this.connect();
  }

  private async connect() {
    try {
      await this.client.connect();
      console.log('📡 Connected to Redis cache');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      if (value) {
        this.stats.hits++;
      } else {
        this.stats.misses++;
      }
      return value;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async set(key: string, value: string, expireSeconds?: number): Promise<void> {
    try {
      if (expireSeconds) {
        await this.client.setEx(key, expireSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      this.stats.sets++;
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) : '0.00'
    };
  }
}
