import NodeCache from 'node-cache';
import Redis from 'ioredis';
import { Logger } from '../utils/Logger';

export interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    maxRetriesPerRequest: number;
  };
  l1: {
    stdTTL: number;
    checkperiod: number;
    maxKeys: number;
  };
}

export class CacheManager {
  private l1Cache: NodeCache;
  private l2Cache: Redis;
  private logger = Logger.getInstance();
  private hitCount = 0;
  private missCount = 0;

  constructor(config?: Partial<CacheConfig>) {
    const defaultConfig: CacheConfig = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: 3
      },
      l1: {
        stdTTL: 300, // 5 minutes
        checkperiod: 60, // 1 minute
        maxKeys: 10000
      }
    };

    const finalConfig = { ...defaultConfig, ...config };

    // Initialize L1 cache (in-memory)
    this.l1Cache = new NodeCache({
      stdTTL: finalConfig.l1.stdTTL,
      checkperiod: finalConfig.l1.checkperiod,
      maxKeys: finalConfig.l1.maxKeys,
      useClones: false
    });

    // Initialize L2 cache (Redis)
    this.l2Cache = new Redis({
      ...finalConfig.redis,
      lazyConnect: true,
      maxRetriesPerRequest: finalConfig.redis.maxRetriesPerRequest
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.l1Cache.on('set', (key) => {
      this.logger.debug(`L1 cache set: ${key}`);
    });

    this.l1Cache.on('expired', (key) => {
      this.logger.debug(`L1 cache expired: ${key}`);
    });

    this.l2Cache.on('connect', () => {
      this.logger.info('Connected to Redis L2 cache');
    });

    this.l2Cache.on('error', (error) => {
      this.logger.error('Redis L2 cache error:', error);
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.l2Cache.connect();
      this.logger.info('Cache manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize cache manager:', error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Try L1 cache first
      const l1Value = this.l1Cache.get<T>(key);
      if (l1Value !== undefined) {
        this.hitCount++;
        this.logger.debug(`L1 cache hit: ${key}`);
        return l1Value;
      }

      // Try L2 cache (Redis)
      const l2Value = await this.l2Cache.get(key);
      if (l2Value) {
        const parsed = JSON.parse(l2Value) as T;
        // Populate L1 cache for next time
        this.l1Cache.set(key, parsed);
        this.hitCount++;
        this.logger.debug(`L2 cache hit: ${key}`);
        return parsed;
      }

      this.missCount++;
      this.logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      this.missCount++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      // Set in L1 cache
      if (ttl) {
        this.l1Cache.set(key, value, ttl);
      } else {
        this.l1Cache.set(key, value);
      }

      // Set in L2 cache (Redis)
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.l2Cache.setex(key, ttl, serialized);
      } else {
        await this.l2Cache.set(key, serialized);
      }

      this.logger.debug(`Cache set: ${key}`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      // Invalidate from L1 cache
      const l1Keys = this.l1Cache.keys();
      const matchingL1Keys = l1Keys.filter(key => key.includes(pattern));
      matchingL1Keys.forEach(key => this.l1Cache.del(key));

      // Invalidate from L2 cache
      const l2Keys = await this.l2Cache.keys(`*${pattern}*`);
      if (l2Keys.length > 0) {
        await this.l2Cache.del(...l2Keys);
      }

      this.logger.info(`Invalidated ${matchingL1Keys.length + l2Keys.length} cache entries for pattern: ${pattern}`);
    } catch (error) {
      this.logger.error(`Cache invalidation error for pattern ${pattern}:`, error);
    }
  }

  async getHitRate(): Promise<number> {
    const total = this.hitCount + this.missCount;
    return total > 0 ? this.hitCount / total : 0;
  }

  async getStatistics(): Promise<any> {
    const l1Stats = this.l1Cache.getStats();
    const redisInfo = await this.l2Cache.info('memory');
    
    return {
      l1: {
        keys: l1Stats.keys,
        hits: l1Stats.hits,
        misses: l1Stats.misses,
        hitRate: l1Stats.hits / (l1Stats.hits + l1Stats.misses) || 0
      },
      l2: {
        connected: this.l2Cache.status === 'ready',
        memory: this.parseRedisMemoryInfo(redisInfo)
      },
      overall: {
        hitRate: await this.getHitRate(),
        totalHits: this.hitCount,
        totalMisses: this.missCount
      }
    };
  }

  private parseRedisMemoryInfo(info: string): any {
    const lines = info.split('\r\n');
    const memoryInfo: any = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key.includes('memory')) {
          memoryInfo[key] = value;
        }
      }
    });
    
    return memoryInfo;
  }

  async shutdown(): Promise<void> {
    this.l1Cache.close();
    await this.l2Cache.quit();
    this.logger.info('Cache manager shutdown complete');
  }
}
