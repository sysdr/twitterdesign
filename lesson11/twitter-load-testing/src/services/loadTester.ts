import axios from 'axios';
import { UserBehaviorPattern } from '../types';

export class LoadTester {
  private baseUrl: string;
  private activeUsers: Map<string, any> = new Map();
  private metrics: UserBehaviorPattern[] = [];

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async simulateUserJourney(userId: string): Promise<UserBehaviorPattern[]> {
    const patterns: UserBehaviorPattern[] = [];
    
    try {
      // 1. Login
      const loginStart = Date.now();
      await this.simulateLogin(userId);
      patterns.push({
        user_id: userId,
        action_type: 'view_timeline',
        duration_ms: Date.now() - loginStart,
        success: true,
        response_time_ms: Date.now() - loginStart
      });

      // 2. View timeline (80% probability)
      if (Math.random() < 0.8) {
        const timelineStart = Date.now();
        await this.simulateTimelineView(userId);
        patterns.push({
          user_id: userId,
          action_type: 'view_timeline',
          duration_ms: Date.now() - timelineStart,
          success: true,
          response_time_ms: Date.now() - timelineStart
        });
      }

      // 3. Like tweets (15% probability)
      if (Math.random() < 0.15) {
        const likeStart = Date.now();
        await this.simulateLikeTweet(userId);
        patterns.push({
          user_id: userId,
          action_type: 'like_tweet',
          duration_ms: Date.now() - likeStart,
          success: true,
          response_time_ms: Date.now() - likeStart
        });
      }

      // 4. Post tweet (5% probability)
      if (Math.random() < 0.05) {
        const postStart = Date.now();
        await this.simulatePostTweet(userId);
        patterns.push({
          user_id: userId,
          action_type: 'post_tweet',
          duration_ms: Date.now() - postStart,
          success: true,
          response_time_ms: Date.now() - postStart
        });
      }

    } catch (error) {
      console.error(`User journey failed for ${userId}:`, error);
      patterns.push({
        user_id: userId,
        action_type: 'view_timeline',
        duration_ms: 0,
        success: false,
        response_time_ms: 0
      });
    }

    return patterns;
  }

  private async simulateLogin(userId: string) {
    const response = await axios.post(`${this.baseUrl}/api/auth/login`, {
      username: `user_${userId}`,
      password: 'testpassword'
    });
    
    this.activeUsers.set(userId, {
      token: response.data.token,
      loginTime: Date.now()
    });
  }

  private async simulateTimelineView(userId: string) {
    const user = this.activeUsers.get(userId);
    await axios.get(`${this.baseUrl}/api/timeline`, {
      headers: { Authorization: `Bearer ${user.token}` }
    });

    // Simulate scroll delay
    await this.sleep(1000 + Math.random() * 2000);
  }

  private async simulateLikeTweet(userId: string) {
    const user = this.activeUsers.get(userId);
    const tweetId = Math.floor(Math.random() * 1000) + 1;
    
    await axios.post(`${this.baseUrl}/api/tweets/${tweetId}/like`, {}, {
      headers: { Authorization: `Bearer ${user.token}` }
    });
  }

  private async simulatePostTweet(userId: string) {
    const user = this.activeUsers.get(userId);
    const content = this.generateRandomTweetContent();
    
    await axios.post(`${this.baseUrl}/api/tweets`, { content }, {
      headers: { Authorization: `Bearer ${user.token}` }
    });
  }

  private generateRandomTweetContent(): string {
    const templates = [
      "Just discovered an amazing new technology! #tech",
      "Beautiful day outside, perfect for a walk! 🌞",
      "Working on some exciting projects today 💻",
      "Anyone else excited about the latest updates?",
      "Sharing some thoughts on system design patterns..."
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runLoadTest(targetUsers: number, durationSeconds: number): Promise<void> {
    console.log(`Starting load test: ${targetUsers} users for ${durationSeconds}s`);
    
    const userPromises: Promise<void>[] = [];
    const startTime = Date.now();

    // Gradual ramp-up over first 30 seconds
    const rampUpDuration = 30000;
    const usersPerSecond = targetUsers / (rampUpDuration / 1000);

    for (let i = 0; i < targetUsers; i++) {
      const delay = (i / usersPerSecond) * 1000;
      
      userPromises.push(
        this.sleep(delay).then(() => this.runUserLoop(i.toString(), durationSeconds))
      );
    }

    await Promise.all(userPromises);
    console.log(`Load test completed in ${Date.now() - startTime}ms`);
  }

  private async runUserLoop(userId: string, durationSeconds: number): Promise<void> {
    const endTime = Date.now() + (durationSeconds * 1000);
    
    while (Date.now() < endTime) {
      const patterns = await this.simulateUserJourney(userId);
      this.metrics.push(...patterns);
      
      // Random pause between actions (1-5 seconds)
      await this.sleep(1000 + Math.random() * 4000);
    }
  }

  getMetrics(): UserBehaviorPattern[] {
    return this.metrics;
  }
}
