import Redis from 'ioredis';
import crypto from 'crypto';

export interface CacheEntry {
  content: any;
  etag: string;
  timestamp: number;
  ttl: number;
  hitCount: number;
  contentType: string;
}

export interface CacheStats {
  hitRate: number;
  totalRequests: number;
  totalHits: number;
  avgResponseTime: number;
}

export class EdgeCacheService {
  private redis: Redis;
  private stats: CacheStats;
  private edgeLocation: string;

  constructor(edgeLocation: string = 'us-east-1') {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
    });
    
    this.edgeLocation = edgeLocation;
    this.stats = {
      hitRate: 0,
      totalRequests: 0,
      totalHits: 0,
      avgResponseTime: 0,
    };
  }

  async get(key: string): Promise<CacheEntry | null> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      const cached = await this.redis.get(`edge:${this.edgeLocation}:${key}`);
      
      if (cached) {
        const entry: CacheEntry = JSON.parse(cached);
        
        // Check TTL
        if (Date.now() - entry.timestamp < entry.ttl * 1000) {
          entry.hitCount++;
          this.stats.totalHits++;
          this.updateStats(Date.now() - startTime);
          
          // Update hit count
          await this.redis.set(
            `edge:${this.edgeLocation}:${key}`,
            JSON.stringify(entry),
            'EX',
            Math.floor((entry.ttl * 1000 - (Date.now() - entry.timestamp)) / 1000)
          );
          
          return entry;
        } else {
          // Expired, remove from cache
          await this.redis.del(`edge:${this.edgeLocation}:${key}`);
        }
      }
      
      this.updateStats(Date.now() - startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.updateStats(Date.now() - startTime);
      return null;
    }
  }

  async set(key: string, content: any, ttl: number = 300, contentType: string = 'application/json'): Promise<void> {
    try {
      const etag = crypto.createHash('md5').update(JSON.stringify(content)).digest('hex');
      
      const entry: CacheEntry = {
        content,
        etag,
        timestamp: Date.now(),
        ttl,
        hitCount: 0,
        contentType,
      };

      await this.redis.set(
        `edge:${this.edgeLocation}:${key}`,
        JSON.stringify(entry),
        'EX',
        ttl
      );

      // Track cache warming
      await this.redis.zadd('cache:warming', Date.now(), key);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      await this.redis.del(`edge:${this.edgeLocation}:${key}`);
      await this.redis.publish('cache:invalidation', JSON.stringify({
        key,
        edgeLocation: this.edgeLocation,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async bulkInvalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`edge:${this.edgeLocation}:${pattern}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Bulk invalidation error:', error);
    }
  }

  getStats(): CacheStats {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.totalHits / this.stats.totalRequests) * 100 
      : 0;
    return { ...this.stats };
  }

  private updateStats(responseTime: number): void {
    this.stats.avgResponseTime = 
      (this.stats.avgResponseTime * (this.stats.totalRequests - 1) + responseTime) 
      / this.stats.totalRequests;
  }
}
