import { Pool, PoolConfig } from 'pg';
import * as Redis from 'redis';

interface ConnectionPoolMetrics {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
}

export class DatabasePool {
  private pool: Pool;
  private redisClient: any;
  private metrics: ConnectionPoolMetrics = {
    totalConnections: 0,
    idleConnections: 0,
    waitingClients: 0
  };

  constructor() {
    const config: PoolConfig = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      min: 10,  // Minimum connections
      max: 50,  // Maximum connections for 1000 users
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    this.pool = new Pool(config);
    
    // Create Redis client with proper configuration
    this.redisClient = Redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    this.setupMetricsCollection();
  }

  private setupMetricsCollection() {
    setInterval(() => {
      this.metrics = {
        totalConnections: this.pool.totalCount,
        idleConnections: this.pool.idleCount,
        waitingClients: this.pool.waitingCount
      };
    }, 1000);
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log slow queries
      if (duration > 100) {
        console.warn(`Slow query detected: ${duration}ms - ${text}`);
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getFromCache(key: string) {
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setInCache(key: string, value: string, ttlSeconds: number = 300) {
    try {
      await this.redisClient.setex(key, ttlSeconds, value);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  getMetrics(): ConnectionPoolMetrics {
    return this.metrics;
  }

  async close() {
    await this.pool.end();
    await this.redisClient.quit();
  }
}

export const dbPool = new DatabasePool();
