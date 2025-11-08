import Redis from 'ioredis';
import { ThreatScore, User } from '../types/index.js';
import UAParser from 'ua-parser-js';

export class AbuseDetectionService {
  private redis: Redis;
  private readonly SCORE_THRESHOLD_BLOCK = 10;
  private readonly SCORE_THRESHOLD_REVIEW = 5;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async calculateThreatScore(userId: string, userAgent: string, ipAddress: string): Promise<ThreatScore> {
    const user = await this.getUserData(userId);
    
    const accountAge = this.scoreAccountAge(user.createdAt);
    const activityPattern = await this.scoreActivityPattern(userId);
    const deviceFingerprint = this.scoreDeviceFingerprint(userAgent);
    const locationPattern = await this.scoreLocationPattern(userId, ipAddress);
    const engagementRate = await this.scoreEngagementRate(userId);

    const totalScore = accountAge + activityPattern + deviceFingerprint + locationPattern + engagementRate;

    const threatScore: ThreatScore = {
      userId,
      score: totalScore,
      factors: {
        accountAge,
        activityPattern,
        deviceFingerprint,
        locationPattern,
        engagementRate
      },
      timestamp: new Date()
    };

    // Store in Redis
    await this.redis.setex(
      `threat_score:${userId}`,
      3600, // 1 hour TTL
      JSON.stringify(threatScore)
    );

    // Take action based on score
    if (totalScore >= this.SCORE_THRESHOLD_BLOCK) {
      await this.blockUser(userId, 'Automated security block due to high threat score');
    } else if (totalScore >= this.SCORE_THRESHOLD_REVIEW) {
      await this.flagForReview(userId, threatScore);
    }

    return threatScore;
  }

  private scoreAccountAge(createdAt: Date): number {
    const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (ageInDays < 1) return 3; // Very new account
    if (ageInDays < 7) return 1; // New account
    return 0; // Established account
  }

  private async scoreActivityPattern(userId: string): Promise<number> {
    // Check posting frequency
    const recentActions = await this.redis.zcount(`user_actions:${userId}`, Date.now() - 3600000, Date.now());
    
    if (recentActions > 100) return 5; // Extremely high activity
    if (recentActions > 50) return 2; // High activity
    return 0;
  }

  private scoreDeviceFingerprint(userAgent: string): number {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // Bots often have unusual or missing user agents
    if (!result.browser.name || !result.os.name) {
      return 2;
    }

    // Check for headless browsers
    if (userAgent.includes('HeadlessChrome') || userAgent.includes('PhantomJS')) {
      return 5;
    }

    return 0;
  }

  private async scoreLocationPattern(userId: string, ipAddress: string): Promise<number> {
    const recentLocations = await this.redis.zrange(`user_locations:${userId}`, 0, -1);
    
    // If user appears in multiple distant locations quickly, it's suspicious
    if (recentLocations.length > 5) {
      return 3;
    }

    return 0;
  }

  private async scoreEngagementRate(userId: string): Promise<number> {
    // Bots typically have very low engagement
    const posts = await this.redis.get(`user_stats:${userId}:posts`) || '0';
    const engagement = await this.redis.get(`user_stats:${userId}:engagement`) || '0';
    
    const postsNum = parseInt(posts);
    const engagementNum = parseInt(engagement);

    if (postsNum > 10 && engagementNum === 0) {
      return 4; // High posting, zero engagement = likely bot
    }

    return 0;
  }

  private async getUserData(userId: string): Promise<User> {
    const data = await this.redis.get(`user:${userId}`);

    if (!data) {
      return {
        id: userId,
        username: `user-${userId}`,
        email: `${userId}@example.com`,
        passwordHash: '',
        createdAt: new Date(),
        isBlocked: false,
        riskScore: 0
      };
    }

    try {
      const parsed = JSON.parse(data);

      return {
        id: parsed.id ?? userId,
        username: parsed.username ?? `user-${userId}`,
        email: parsed.email ?? `${userId}@example.com`,
        passwordHash: parsed.passwordHash ?? '',
        createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
        lastLoginAt: parsed.lastLoginAt ? new Date(parsed.lastLoginAt) : undefined,
        isBlocked: parsed.isBlocked ?? false,
        riskScore: parsed.riskScore ?? 0
      };
    } catch (error) {
      return {
        id: userId,
        username: `user-${userId}`,
        email: `${userId}@example.com`,
        passwordHash: '',
        createdAt: new Date(),
        isBlocked: false,
        riskScore: 0
      };
    }
  }

  private async blockUser(userId: string, reason: string): Promise<void> {
    await this.redis.set(`user:${userId}:blocked`, '1');
    await this.redis.lpush('blocked_users', JSON.stringify({ userId, reason, timestamp: new Date() }));
  }

  private async flagForReview(userId: string, threatScore: ThreatScore): Promise<void> {
    await this.redis.lpush('flagged_users', JSON.stringify({ userId, threatScore, timestamp: new Date() }));
  }

  async recordUserAction(userId: string, action: string, metadata: any): Promise<void> {
    const timestamp = Date.now();
    await this.redis.zadd(`user_actions:${userId}`, timestamp, JSON.stringify({ action, metadata, timestamp }));
    
    // Keep only last 24 hours of actions
    await this.redis.zremrangebyscore(`user_actions:${userId}`, 0, timestamp - 86400000);
  }
}
