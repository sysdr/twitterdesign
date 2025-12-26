import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected'));

export class RedisCache {
  static async connect() {
    if (!client.isOpen) {
      await client.connect();
    }
  }

  static async get(key: string): Promise<any> {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  }

  static async set(key: string, value: any, expirySeconds?: number) {
    const serialized = JSON.stringify(value);
    if (expirySeconds) {
      await client.setEx(key, expirySeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
  }

  static async del(key: string) {
    await client.del(key);
  }

  static async publish(channel: string, message: any) {
    await client.publish(channel, JSON.stringify(message));
  }

  static async subscribe(channel: string, handler: (message: any) => void) {
    const subscriber = client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channel, (message) => {
      handler(JSON.parse(message));
    });
    return subscriber;
  }
}
