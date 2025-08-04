import { Tweet, TweetVersion, TweetEngagement } from '../../types/tweet';
import { nanoid } from 'nanoid';

export class TweetModel {
  private static tweets: Map<string, Tweet> = new Map();
  private static versions: Map<string, TweetVersion[]> = new Map();
  private static engagement: Map<string, TweetEngagement> = new Map();

  static async create(tweetData: Omit<Tweet, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'engagement'>): Promise<Tweet> {
    const id = nanoid();
    const now = new Date();
    
    const engagement: TweetEngagement = {
      likes: 0,
      retweets: 0,
      replies: 0,
      views: 0,
      likedByCurrentUser: false,
      retweetedByCurrentUser: false
    };

    const tweet: Tweet = {
      ...tweetData,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
      engagement
    };

    // Store tweet
    this.tweets.set(id, tweet);
    this.engagement.set(id, engagement);
    
    // Create initial version
    const version: TweetVersion = {
      id: nanoid(),
      tweetId: id,
      content: tweet.content,
      version: 1,
      createdAt: now,
      changes: ['Initial creation']
    };
    
    this.versions.set(id, [version]);

    return tweet;
  }

  static async findById(id: string): Promise<Tweet | null> {
    const tweet = this.tweets.get(id);
    if (!tweet) return null;

    // Increment view count
    const engagement = this.engagement.get(id);
    if (engagement) {
      engagement.views++;
      this.engagement.set(id, engagement);
      tweet.engagement = engagement;
    }

    return tweet;
  }

  static async findAll(filters: any = {}): Promise<Tweet[]> {
    let tweets = Array.from(this.tweets.values());
    
    if (filters.authorId) {
      tweets = tweets.filter(t => t.authorId === filters.authorId);
    }
    
    if (filters.hashtag) {
      tweets = tweets.filter(t => t.content.includes(`#${filters.hashtag}`));
    }

    if (filters.hasMedia) {
      tweets = tweets.filter(t => t.mediaUrls.length > 0);
    }

    // Sort by creation date (newest first)
    tweets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 20;
    
    return tweets.slice(offset, offset + limit);
  }

  static async update(id: string, content: string): Promise<Tweet | null> {
    const tweet = this.tweets.get(id);
    if (!tweet) return null;

    const now = new Date();
    const newVersion = tweet.version + 1;
    
    // Calculate changes (simplified)
    const changes = [`Content updated from "${tweet.content.substring(0, 50)}..." to "${content.substring(0, 50)}..."`];
    
    // Create new version
    const version: TweetVersion = {
      id: nanoid(),
      tweetId: id,
      content,
      version: newVersion,
      createdAt: now,
      changes
    };
    
    const versions = this.versions.get(id) || [];
    versions.push(version);
    this.versions.set(id, versions);

    // Update tweet
    tweet.content = content;
    tweet.updatedAt = now;
    tweet.version = newVersion;
    
    this.tweets.set(id, tweet);
    return tweet;
  }

  static async updateEngagement(id: string, action: string, userId: string): Promise<TweetEngagement | null> {
    const engagement = this.engagement.get(id);
    if (!engagement) return null;

    switch (action) {
      case 'like':
        engagement.likes++;
        engagement.likedByCurrentUser = true;
        break;
      case 'unlike':
        engagement.likes = Math.max(0, engagement.likes - 1);
        engagement.likedByCurrentUser = false;
        break;
      case 'retweet':
        engagement.retweets++;
        engagement.retweetedByCurrentUser = true;
        break;
      case 'unretweet':
        engagement.retweets = Math.max(0, engagement.retweets - 1);
        engagement.retweetedByCurrentUser = false;
        break;
    }

    this.engagement.set(id, engagement);
    
    // Update tweet object
    const tweet = this.tweets.get(id);
    if (tweet) {
      tweet.engagement = engagement;
      this.tweets.set(id, tweet);
    }

    return engagement;
  }

  static async getVersions(tweetId: string): Promise<TweetVersion[]> {
    return this.versions.get(tweetId) || [];
  }

  static async delete(id: string): Promise<boolean> {
    const deleted = this.tweets.delete(id);
    this.versions.delete(id);
    this.engagement.delete(id);
    return deleted;
  }

  // Performance monitoring
  static getStats() {
    return {
      totalTweets: this.tweets.size,
      totalVersions: Array.from(this.versions.values()).reduce((sum, versions) => sum + versions.length, 0),
      totalEngagements: Array.from(this.engagement.values()).reduce((sum, eng) => 
        sum + eng.likes + eng.retweets + eng.replies, 0)
    };
  }
}
