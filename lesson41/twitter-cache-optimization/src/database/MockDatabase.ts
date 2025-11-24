/**
 * Mock Database for Testing
 * Simulates database latency and tweet storage
 */

export interface Tweet {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
  likes: number;
}

export class MockDatabase {
  private tweets: Map<string, Tweet>;
  private queryCount: number;
  private totalLatency: number;

  constructor() {
    this.tweets = new Map();
    this.queryCount = 0;
    this.totalLatency = 0;
    this.seedData();
  }

  /**
   * Seed with sample data
   */
  private seedData(): void {
    for (let i = 1; i <= 1000; i++) {
      const tweet: Tweet = {
        id: `tweet_${i}`,
        userId: `user_${Math.ceil(i / 10)}`,
        content: `This is tweet number ${i} with some interesting content`,
        timestamp: Date.now() - Math.random() * 86400000,
        likes: Math.floor(Math.random() * 100)
      };
      this.tweets.set(tweet.id, tweet);
    }
  }

  /**
   * Simulate database query with latency
   */
  async query(tweetId: string): Promise<Tweet | null> {
    // Simulate 50ms database latency
    const latency = 50 + Math.random() * 20;
    await new Promise(resolve => setTimeout(resolve, latency));
    
    this.queryCount++;
    this.totalLatency += latency;

    return this.tweets.get(tweetId) || null;
  }

  /**
   * Get database statistics
   */
  getStats() {
    return {
      totalQueries: this.queryCount,
      averageLatency: this.queryCount > 0 
        ? Math.round(this.totalLatency / this.queryCount) 
        : 0,
      totalLatency: Math.round(this.totalLatency)
    };
  }

  reset(): void {
    this.queryCount = 0;
    this.totalLatency = 0;
  }
}

