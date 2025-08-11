import { CacheManager } from '../cache/CacheManager';
import { Logger } from '../utils/Logger';
import { v4 as uuidv4 } from 'uuid';

export interface Tweet {
  id: string;
  userId: string;
  content: string;
  mediaUrls: string[];
  createdAt: Date;
  likes: number;
  retweets: number;
  replies: number;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  followers: string[];
  following: string[];
}

export interface TimelineResponse {
  tweets: Tweet[];
  cached: boolean;
  page: number;
  hasMore: boolean;
}

export class TwitterService {
  private logger = Logger.getInstance();
  private mockUsers: Map<string, User> = new Map();
  private mockTweets: Map<string, Tweet> = new Map();

  constructor(private cacheManager: CacheManager) {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Create mock users
    const users: User[] = [
      {
        id: 'user1',
        username: 'techguru',
        displayName: 'Tech Guru',
        followers: ['user2', 'user3'],
        following: ['user2']
      },
      {
        id: 'user2',
        username: 'designpro',
        displayName: 'Design Pro',
        followers: ['user1', 'user3'],
        following: ['user1', 'user3']
      },
      {
        id: 'user3',
        username: 'datacient',
        displayName: 'Data Scientist',
        followers: ['user1', 'user2'],
        following: ['user1', 'user2']
      }
    ];

    users.forEach(user => this.mockUsers.set(user.id, user));

    // Create mock tweets
    const tweets: Tweet[] = [
      {
        id: uuidv4(),
        userId: 'user1',
        content: 'Just implemented a multi-layer caching system! 🚀 Response times improved by 10x',
        mediaUrls: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        likes: 42,
        retweets: 15,
        replies: 8
      },
      {
        id: uuidv4(),
        userId: 'user2',
        content: 'Clean design is like a joke - if you have to explain it, it\'s not that good. #UX #Design',
        mediaUrls: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        likes: 28,
        retweets: 12,
        replies: 5
      },
      {
        id: uuidv4(),
        userId: 'user3',
        content: 'Machine learning model deployed with 99.7% accuracy! The key was feature engineering 📊',
        mediaUrls: [],
        createdAt: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
        likes: 67,
        retweets: 23,
        replies: 12
      }
    ];

    tweets.forEach(tweet => this.mockTweets.set(tweet.id, tweet));
  }

  async getUserTimeline(userId: string, page: number = 1, limit: number = 20): Promise<TimelineResponse> {
    const cacheKey = `timeline:${userId}:${page}:${limit}`;
    
    // Try to get from cache first
    const cached = await this.cacheManager.get<TimelineResponse>(cacheKey);
    if (cached) {
      this.logger.info(`Timeline cache hit for user ${userId}`);
      return { ...cached, cached: true };
    }

    // Simulate database query delay
    await this.simulateDbDelay(50, 150);

    const user = this.mockUsers.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Get tweets from users that this user follows + own tweets
    const relevantUserIds = [...user.following, userId];
    const allTweets = Array.from(this.mockTweets.values())
      .filter(tweet => relevantUserIds.includes(tweet.userId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const tweets = allTweets.slice(startIndex, endIndex);

    const response: TimelineResponse = {
      tweets,
      cached: false,
      page,
      hasMore: endIndex < allTweets.length
    };

    // Cache the response for 5 minutes
    await this.cacheManager.set(cacheKey, response, 300);
    
    this.logger.info(`Timeline generated for user ${userId}, cached for future requests`);
    return response;
  }

  async createTweet(tweetData: Omit<Tweet, 'id' | 'createdAt' | 'likes' | 'retweets' | 'replies'>): Promise<Tweet> {
    const tweet: Tweet = {
      id: uuidv4(),
      ...tweetData,
      createdAt: new Date(),
      likes: 0,
      retweets: 0,
      replies: 0
    };

    // Store tweet
    this.mockTweets.set(tweet.id, tweet);

    // Invalidate cache for user's followers' timelines
    const user = this.mockUsers.get(tweet.userId);
    if (user) {
      const followersToInvalidate = [tweet.userId, ...user.followers];
      
      for (const followerId of followersToInvalidate) {
        await this.cacheManager.invalidate(`timeline:${followerId}`);
      }
      
      this.logger.info(`Invalidated timeline cache for ${followersToInvalidate.length} users after tweet creation`);
    }

    // Invalidate trending topics cache
    await this.cacheManager.invalidate('trending');

    return tweet;
  }

  async getTrendingTopics(): Promise<{ topics: string[]; cached: boolean }> {
    const cacheKey = 'trending:global';
    
    const cached = await this.cacheManager.get<{ topics: string[] }>(cacheKey);
    if (cached) {
      this.logger.info('Trending topics cache hit');
      return { ...cached, cached: true };
    }

    // Simulate complex trending calculation
    await this.simulateDbDelay(200, 500);

    // Extract hashtags and mentions from recent tweets
    const recentTweets = Array.from(this.mockTweets.values())
      .filter(tweet => Date.now() - tweet.createdAt.getTime() < 24 * 60 * 60 * 1000) // Last 24 hours
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const hashtags = new Map<string, number>();
    
    recentTweets.forEach(tweet => {
      const matches = tweet.content.match(/#\w+/g) || [];
      matches.forEach(hashtag => {
        hashtags.set(hashtag, (hashtags.get(hashtag) || 0) + 1);
      });
    });

    const topics = Array.from(hashtags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([hashtag]) => hashtag);

    // Add some default trending topics if not enough hashtags
    if (topics.length < 5) {
      topics.push('#Technology', '#Design', '#MachineLearning', '#WebDev', '#DataScience');
    }

    const response = { topics: topics.slice(0, 10) };
    
    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, response, 600);
    
    this.logger.info('Trending topics calculated and cached');
    return { ...response, cached: false };
  }

  private async simulateDbDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
