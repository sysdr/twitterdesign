import Redis from 'ioredis';
import { SecurityEvent } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import geoip from 'geoip-lite';

export class SecurityEventLogger {
  private redis: Redis;
  private events: SecurityEvent[] = [];

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async logEvent(
    type: SecurityEvent['type'],
    ipAddress: string,
    userAgent: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const geo = geoip.lookup(ipAddress);
    
    const event: SecurityEvent = {
      id: uuidv4(),
      type,
      userId,
      ipAddress,
      userAgent,
      location: geo ? {
        country: geo.country,
        city: geo.city || 'Unknown',
        lat: geo.ll[0],
        lon: geo.ll[1]
      } : undefined,
      timestamp: new Date(),
      metadata
    };

    this.events.push(event);
    
    // Store in Redis
    await this.redis.lpush('security_events', JSON.stringify(event));
    await this.redis.ltrim('security_events', 0, 9999); // Keep last 10k events

    // Store by type for quick filtering
    await this.redis.lpush(`security_events:${type}`, JSON.stringify(event));
    await this.redis.ltrim(`security_events:${type}`, 0, 999);
  }

  async getRecentEvents(limit: number = 100): Promise<SecurityEvent[]> {
    const events = await this.redis.lrange('security_events', 0, limit - 1);
    return events.map(e => JSON.parse(e));
  }

  async getEventsByType(type: SecurityEvent['type'], limit: number = 100): Promise<SecurityEvent[]> {
    const events = await this.redis.lrange(`security_events:${type}`, 0, limit - 1);
    return events.map(e => JSON.parse(e));
  }

  async getEventStats(): Promise<Record<string, number>> {
    const types: SecurityEvent['type'][] = ['login_attempt', 'failed_login', 'rate_limit_exceeded', 'suspicious_activity', 'blocked_action'];
    const stats: Record<string, number> = {};

    for (const type of types) {
      stats[type] = await this.redis.llen(`security_events:${type}`);
    }

    return stats;
  }
}
