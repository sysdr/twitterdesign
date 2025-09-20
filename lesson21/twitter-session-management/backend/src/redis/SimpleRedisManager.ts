import { createClient, RedisClientType } from 'redis';

export class SimpleRedisManager {
  private client: RedisClientType | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.client = createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
    });

    this.client.on('error', (err) => {
      console.error('Redis Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis connected');
    });

    await this.client.connect();
    this.initialized = true;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) throw new Error('Redis not initialized');
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client) throw new Error('Redis not initialized');
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    if (!this.client) throw new Error('Redis not initialized');
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    if (!this.client) throw new Error('Redis not initialized');
    return await this.client.exists(key);
  }

  async healthCheck(): Promise<any> {
    if (!this.client) return { status: 'disconnected' };
    
    try {
      await this.client.ping();
      return {
        status: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.initialized = false;
    }
  }
}
