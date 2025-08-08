import { createClient, RedisClientType } from 'redis';
import { Event, EventType } from '../../types/index.js';

export class RedisService {
  private client: RedisClientType;
  private subscriber: RedisClientType;
  private publisher: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.subscriber = this.client.duplicate();
    this.publisher = this.client.duplicate();
  }

  async connect(): Promise<void> {
    await Promise.all([
      this.client.connect(),
      this.subscriber.connect(), 
      this.publisher.connect()
    ]);
    console.log('✅ Redis connected');
  }

  async publishEvent(channel: string, event: Event): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(event));
  }

  async subscribe(channel: string, callback: (event: Event) => void): Promise<void> {
    await this.subscriber.subscribe(channel, (message) => {
      const event: Event = JSON.parse(message);
      callback(event);
    });
  }

  async setUserOnline(userId: string, connectionId: string): Promise<void> {
    await this.client.hSet('online_users', userId, connectionId);
    await this.client.sAdd('active_connections', connectionId);
  }

  async setUserOffline(userId: string, connectionId: string): Promise<void> {
    await this.client.hDel('online_users', userId);
    await this.client.sRem('active_connections', connectionId);
  }

  async getOnlineUsers(): Promise<string[]> {
    return await this.client.hKeys('online_users');
  }

  async cacheTimeline(userId: string, tweets: any[]): Promise<void> {
    await this.client.setEx(`timeline:${userId}`, 300, JSON.stringify(tweets));
  }

  async getTimeline(userId: string): Promise<any[] | null> {
    const cached = await this.client.get(`timeline:${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.client.disconnect(),
      this.subscriber.disconnect(),
      this.publisher.disconnect()
    ]);
  }
}
