import Redis from 'redis';

interface UserFeatures {
  userId: string;
  engagementRate: number;
  influenceScore: number;
  activityLevel: 'low' | 'medium' | 'high';
  lastActiveAt: number;
}

export class FeatureStore {
  private redis: any;
  private metrics = {
    tweetsPerMinute: 0,
    activeUsers: 0,
    engagementRate: 0,
    viralContent: 0
  };

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      this.redis = Redis.createClient({
        url: `redis://${process.env.REDIS_HOST || 'localhost'}:${parseInt(process.env.REDIS_PORT || '6379')}`
      });
      
      await this.redis.connect();
      console.log('📚 Feature Store connected to Redis');
    } catch (error) {
      console.log('⚠️  Using in-memory feature store (Redis not available)');
      this.redis = new Map(); // Fallback to in-memory
    }
  }

  async updateFeatures(event: any) {
    // Update user features based on event
    const key = `user_features:${event.userId}`;
    const features = await this.getUserFeatures(event.userId) || {
      userId: event.userId,
      engagementRate: 0,
      influenceScore: 0,
      activityLevel: 'low' as const,
      lastActiveAt: Date.now()
    };

    // Update engagement rate
    if (event.type === 'like' || event.type === 'retweet') {
      features.engagementRate += 0.1;
    }

    // Update activity level
    features.lastActiveAt = Date.now();
    const hoursSinceActive = (Date.now() - features.lastActiveAt) / (1000 * 60 * 60);
    
    if (hoursSinceActive < 1) features.activityLevel = 'high';
    else if (hoursSinceActive < 6) features.activityLevel = 'medium';
    else features.activityLevel = 'low';

    await this.setUserFeatures(event.userId, features);
  }

  async getUserFeatures(userId: string): Promise<UserFeatures | null> {
    try {
      if (this.redis.get) {
        const data = await this.redis.get(`user_features:${userId}`);
        return data ? JSON.parse(data) : null;
      } else {
        return this.redis.get(`user_features:${userId}`) || null;
      }
    } catch (error) {
      return null;
    }
  }

  async setUserFeatures(userId: string, features: UserFeatures) {
    try {
      if (this.redis.setEx) {
        await this.redis.setEx(`user_features:${userId}`, 3600, JSON.stringify(features));
      } else {
        this.redis.set(`user_features:${userId}`, features);
      }
    } catch (error) {
      console.error('Failed to set user features:', error);
    }
  }

  async getRealTimeMetrics() {
    return this.metrics;
  }

  async calculateRealTimeMetrics() {
    // Simulate real-time metric calculation
    this.metrics.tweetsPerMinute = Math.floor(Math.random() * 1000) + 500;
    this.metrics.activeUsers = Math.floor(Math.random() * 10000) + 5000;
    this.metrics.engagementRate = Math.random() * 10 + 5;
    this.metrics.viralContent = Math.floor(Math.random() * 10) + 1;
    
    return this.metrics;
  }

  async getLatestEngagement() {
    return {
      timestamp: new Date().toISOString(),
      likes: Math.floor(Math.random() * 1000) + 200,
      retweets: Math.floor(Math.random() * 500) + 100,
      replies: Math.floor(Math.random() * 300) + 50
    };
  }

  async getTrendingTopics() {
    const topics = ['AI', 'blockchain', 'climate', 'sports', 'music', 'tech'];
    return topics.map(topic => ({
      topic: `#${topic}`,
      mentions: Math.floor(Math.random() * 5000) + 1000,
      trend: Math.random() > 0.5 ? 'rising' as const : 'stable' as const
    }));
  }

  async detectTrendingTopics() {
    return this.getTrendingTopics();
  }

  async markAsViral(eventId: string) {
    this.metrics.viralContent += 1;
    console.log(`🔥 Viral content detected: ${eventId}`);
  }
}
