import { CacheManager } from '../cache/CacheManager';
import { EventEmitter } from 'events';

export interface WarmingJob {
  id: string;
  type: 'timeline' | 'trending' | 'user_profile' | 'tweet_content';
  priority: 'high' | 'medium' | 'low';
  keys: string[];
  data: any[];
  estimatedTime: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export class WarmingEngine extends EventEmitter {
  private cacheManager: CacheManager;
  private runningJobs = new Map<string, WarmingJob>();
  private completedJobs: WarmingJob[] = [];
  private isRunning = false;

  constructor(cacheManager: CacheManager) {
    super();
    this.cacheManager = cacheManager;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔥 Cache warming engine started');
    
    // Start warming popular content
    this.warmPopularContent();
    this.warmTrendingHashtags();
    this.warmUserTimelines();
    
    this.emit('warmingStarted');
  }

  public stop(): void {
    this.isRunning = false;
    console.log('⏹️  Cache warming engine stopped');
    this.emit('warmingStopped');
  }

  private async warmPopularContent(): Promise<void> {
    const job: WarmingJob = {
      id: `popular-${Date.now()}`,
      type: 'tweet_content',
      priority: 'high',
      keys: [],
      data: [],
      estimatedTime: 5000,
      status: 'running'
    };

    this.runningJobs.set(job.id, job);

    try {
      // Simulate popular tweet content
      const popularTweets = this.generatePopularTweets(100);
      
      for (const tweet of popularTweets) {
        const key = `tweet:${tweet.id}`;
        await this.cacheManager.set(key, JSON.stringify(tweet), 7200); // 2 hour TTL
        job.keys.push(key);
      }

      job.status = 'completed';
      this.completedJobs.push(job);
      this.runningJobs.delete(job.id);

      console.log(`✅ Warmed ${popularTweets.length} popular tweets`);
      this.emit('jobCompleted', job);

    } catch (error) {
      job.status = 'failed';
      console.error('❌ Failed to warm popular content:', error);
      this.emit('jobFailed', { job, error });
    }
  }

  private async warmTrendingHashtags(): Promise<void> {
    const job: WarmingJob = {
      id: `trending-${Date.now()}`,
      type: 'trending',
      priority: 'high',
      keys: [],
      data: [],
      estimatedTime: 3000,
      status: 'running'
    };

    this.runningJobs.set(job.id, job);

    try {
      const trendingTopics = this.generateTrendingTopics(50);
      
      for (const topic of trendingTopics) {
        const key = `trending:${topic.hashtag}`;
        await this.cacheManager.set(key, JSON.stringify(topic), 1800); // 30 min TTL
        job.keys.push(key);
      }

      // Cache global trending list
      const globalKey = 'trending:global';
      await this.cacheManager.set(globalKey, JSON.stringify(trendingTopics), 600); // 10 min TTL
      job.keys.push(globalKey);

      job.status = 'completed';
      this.completedJobs.push(job);
      this.runningJobs.delete(job.id);

      console.log(`✅ Warmed ${trendingTopics.length} trending topics`);
      this.emit('jobCompleted', job);

    } catch (error) {
      job.status = 'failed';
      console.error('❌ Failed to warm trending hashtags:', error);
      this.emit('jobFailed', { job, error });
    }
  }

  private async warmUserTimelines(): Promise<void> {
    const job: WarmingJob = {
      id: `timelines-${Date.now()}`,
      type: 'timeline',
      priority: 'medium',
      keys: [],
      data: [],
      estimatedTime: 8000,
      status: 'running'
    };

    this.runningJobs.set(job.id, job);

    try {
      // Simulate active user timelines
      const activeUsers = this.generateActiveUsers(1000);
      
      for (const user of activeUsers) {
        const timelineKey = `timeline:${user.id}:page:1`;
        const timeline = this.generateUserTimeline(user.id, 20);
        
        await this.cacheManager.set(timelineKey, JSON.stringify(timeline), 3600); // 1 hour TTL
        job.keys.push(timelineKey);
      }

      job.status = 'completed';
      this.completedJobs.push(job);
      this.runningJobs.delete(job.id);

      console.log(`✅ Warmed ${activeUsers.length} user timelines`);
      this.emit('jobCompleted', job);

    } catch (error) {
      job.status = 'failed';
      console.error('❌ Failed to warm user timelines:', error);
      this.emit('jobFailed', { job, error });
    }
  }

  private generatePopularTweets(count: number): any[] {
    const tweets = [];
    const sampleTexts = [
      "Breaking: Major breakthrough in quantum computing announced!",
      "Just launched our new distributed caching system 🚀",
      "Beautiful sunset from the International Space Station",
      "New study reveals surprising benefits of distributed systems",
      "AI model achieves 99% accuracy on complex reasoning tasks"
    ];

    for (let i = 0; i < count; i++) {
      tweets.push({
        id: `tweet_${Date.now()}_${i}`,
        userId: `user_${Math.floor(Math.random() * 10000)}`,
        content: sampleTexts[i % sampleTexts.length],
        timestamp: new Date().toISOString(),
        likes: Math.floor(Math.random() * 10000),
        retweets: Math.floor(Math.random() * 5000),
        replies: Math.floor(Math.random() * 1000),
        trending: true
      });
    }

    return tweets;
  }

  private generateTrendingTopics(count: number): any[] {
    const topics = [];
    const sampleHashtags = [
      '#DistributedSystems', '#CloudComputing', '#MachineLearning',
      '#WebDevelopment', '#DataScience', '#Cybersecurity',
      '#BlockChain', '#IoT', '#5G', '#QuantumComputing'
    ];

    for (let i = 0; i < count; i++) {
      topics.push({
        hashtag: sampleHashtags[i % sampleHashtags.length],
        tweetCount: Math.floor(Math.random() * 100000) + 1000,
        momentum: Math.random() * 100,
        region: ['global', 'us', 'eu', 'asia'][Math.floor(Math.random() * 4)],
        timestamp: new Date().toISOString()
      });
    }

    return topics.sort((a, b) => b.tweetCount - a.tweetCount);
  }

  private generateActiveUsers(count: number): any[] {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push({
        id: `user_${i}`,
        username: `user${i}`,
        followers: Math.floor(Math.random() * 100000),
        lastActive: new Date().toISOString(),
        region: ['us-west', 'us-east', 'eu-west'][Math.floor(Math.random() * 3)]
      });
    }
    return users;
  }

  private generateUserTimeline(userId: string, count: number): any[] {
    const timeline = [];
    for (let i = 0; i < count; i++) {
      timeline.push({
        id: `timeline_${userId}_${i}`,
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        content: `Sample tweet content for timeline ${i}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(), // 1 min intervals
        likes: Math.floor(Math.random() * 1000),
        retweets: Math.floor(Math.random() * 100)
      });
    }
    return timeline;
  }

  public getRunningJobs(): WarmingJob[] {
    return Array.from(this.runningJobs.values());
  }

  public getCompletedJobs(): WarmingJob[] {
    return this.completedJobs.slice(-10); // Return last 10 completed jobs
  }

  public getStats(): any {
    return {
      totalJobsCompleted: this.completedJobs.length,
      runningJobs: this.runningJobs.size,
      isRunning: this.isRunning,
      successRate: this.completedJobs.filter(job => job.status === 'completed').length / 
                   Math.max(this.completedJobs.length, 1) * 100
    };
  }
}
