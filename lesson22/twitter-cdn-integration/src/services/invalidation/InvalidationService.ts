import Redis from 'ioredis';
import { EventEmitter } from 'events';

export interface InvalidationEvent {
  type: 'content' | 'user' | 'timeline' | 'trending';
  key: string;
  affectedRegions: string[];
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
}

export class InvalidationService extends EventEmitter {
  private redis: Redis;
  private subscriber: Redis;
  private edgeLocations: string[];

  constructor(edgeLocations: string[] = ['us-east-1', 'eu-west-1', 'ap-southeast-1']) {
    super();
    
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
    
    this.subscriber = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
    
    this.edgeLocations = edgeLocations;
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    this.subscriber.subscribe('content:update', 'user:update', 'trending:update');
    
    this.subscriber.on('message', async (channel, message) => {
      try {
        const data = JSON.parse(message);
        await this.handleInvalidationEvent(channel, data);
      } catch (error) {
        console.error('Invalidation subscription error:', error);
      }
    });
  }

  async invalidateContent(contentId: string, contentType: string): Promise<void> {
    const event: InvalidationEvent = {
      type: 'content',
      key: `${contentType}:${contentId}`,
      affectedRegions: this.edgeLocations,
      priority: 'high',
      timestamp: Date.now(),
    };

    await this.processInvalidation(event);
  }

  async invalidateUserContent(userId: string): Promise<void> {
    const patterns = [
      `user:${userId}:*`,
      `timeline:*:${userId}`,
      `profile:${userId}`,
    ];

    for (const pattern of patterns) {
      const event: InvalidationEvent = {
        type: 'user',
        key: pattern,
        affectedRegions: this.edgeLocations,
        priority: 'medium',
        timestamp: Date.now(),
      };

      await this.processInvalidation(event);
    }
  }

  async invalidateTrending(): Promise<void> {
    const event: InvalidationEvent = {
      type: 'trending',
      key: 'trending:*',
      affectedRegions: this.edgeLocations,
      priority: 'low',
      timestamp: Date.now(),
    };

    await this.processInvalidation(event);
  }

  private async processInvalidation(event: InvalidationEvent): Promise<void> {
    try {
      // Add to invalidation queue with priority
      await this.redis.zadd(
        `invalidation:queue:${event.priority}`,
        Date.now(),
        JSON.stringify(event)
      );

      // Publish to all edge locations
      for (const region of event.affectedRegions) {
        await this.redis.publish(
          `invalidation:${region}`,
          JSON.stringify(event)
        );
      }

      // Track invalidation metrics
      await this.redis.hincrby('invalidation:stats', event.type, 1);
      
      this.emit('invalidation', event);
    } catch (error) {
      console.error('Invalidation processing error:', error);
    }
  }

  private async handleInvalidationEvent(channel: string, data: any): Promise<void> {
    switch (channel) {
      case 'content:update':
        await this.invalidateContent(data.id, data.type);
        break;
      case 'user:update':
        await this.invalidateUserContent(data.userId);
        break;
      case 'trending:update':
        await this.invalidateTrending();
        break;
    }
  }

  async getInvalidationStats(): Promise<Record<string, number>> {
    try {
      const stats = await this.redis.hgetall('invalidation:stats');
      const result: Record<string, number> = {};
      for (const [key, value] of Object.entries(stats)) {
        result[key] = parseInt(value) || 0;
      }
      return result;
    } catch (error) {
      console.error('Error getting invalidation stats:', error);
      return {};
    }
  }
}
