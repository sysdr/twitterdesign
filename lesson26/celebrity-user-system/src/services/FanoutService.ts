import { Tweet, User, UserTier, FanoutStrategy, ProcessingStatus } from '../types';

export class FanoutService {
  private processingQueue: Tweet[] = [];

  constructor() {
  }

  async processTweet(tweet: Tweet, author: User, followers: User[]): Promise<Tweet> {
    const strategy = this.selectFanoutStrategy(author, followers.length);
    const updatedTweet = { ...tweet, fanoutStrategy: strategy, status: ProcessingStatus.PROCESSING };
    
    this.processingQueue.push(updatedTweet);
    
    try {
      const result = await this.executeFanout(updatedTweet, author, followers);
      this.removeFromQueue(updatedTweet.id);
      return result;
    } catch (error) {
      this.removeFromQueue(updatedTweet.id);
      throw error;
    }
  }

  private selectFanoutStrategy(author: User, followerCount: number): FanoutStrategy {
    switch (author.tier) {
      case UserTier.CELEBRITY:
        return FanoutStrategy.HYBRID;
      case UserTier.POPULAR:
        return followerCount > 50_000 ? FanoutStrategy.HYBRID : FanoutStrategy.PUSH;
      default:
        return FanoutStrategy.PUSH;
    }
  }

  private async executeFanout(tweet: Tweet, author: User, followers: User[]): Promise<Tweet> {
    switch (tweet.fanoutStrategy) {
      case FanoutStrategy.PUSH:
        return this.executePushFanout(tweet, followers);
      case FanoutStrategy.HYBRID:
        return this.executeHybridFanout(tweet, author, followers);
      default:
        return { ...tweet, status: ProcessingStatus.COMPLETED, processedFollowers: 0 };
    }
  }

  private async executePushFanout(tweet: Tweet, followers: User[]): Promise<Tweet> {
    // Simulate immediate push to all followers
    await this.delay(100); // Simulate processing time
    
    return {
      ...tweet,
      status: ProcessingStatus.COMPLETED,
      processedFollowers: followers.length,
      totalFollowers: followers.length
    };
  }

  private async executeHybridFanout(tweet: Tweet, _author: User, followers: User[]): Promise<Tweet> {
    const activeFollowerThreshold = 0.2; // Push to top 20% active followers
    const activeFollowers = Math.floor(followers.length * activeFollowerThreshold);
    
    // Simulate gradual processing for celebrity tweets
    const batchSize = Math.min(10_000, activeFollowers);
    let processed = 0;
    
    while (processed < activeFollowers) {
      await this.delay(50); // Simulate batch processing delay
      processed += Math.min(batchSize, activeFollowers - processed);
      
      // Update progress
      tweet.processedFollowers = processed;
    }
    
    // Cache for remaining followers (pull-based)
    await this.cacheForPullAccess(tweet, followers.length - activeFollowers);
    
    return {
      ...tweet,
      status: ProcessingStatus.COMPLETED,
      processedFollowers: activeFollowers,
      totalFollowers: followers.length
    };
  }

  private async cacheForPullAccess(tweet: Tweet, remainingFollowers: number): Promise<void> {
    // Simulate caching operation
    await this.delay(200);
    console.log(`🔄 Cached tweet ${tweet.id} for ${remainingFollowers} followers`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private removeFromQueue(tweetId: string): void {
    this.processingQueue = this.processingQueue.filter(t => t.id !== tweetId);
  }

  getQueueStatus(): { depth: number; processing: Tweet[] } {
    return {
      depth: this.processingQueue.length,
      processing: [...this.processingQueue]
    };
  }
}
