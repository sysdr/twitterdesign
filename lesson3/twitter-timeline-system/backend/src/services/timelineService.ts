import { db } from './database.js';
import { redis } from './redis.js';
import { Tweet, User } from '../models/Tweet.js';

export type TimelineModel = 'pull' | 'push' | 'hybrid';

export interface TimelineResponse {
  tweets: Tweet[];
  nextCursor?: string;
  hasMore: boolean;
  generationTime: number;
  model: TimelineModel;
}

interface TimelineResult {
  tweets: Tweet[];
  nextCursor?: string;
  hasMore: boolean;
}

export class TimelineService {
  
  async getTimeline(userId: string, cursor?: string, limit: number = 20): Promise<TimelineResponse> {
    const startTime = Date.now();
    
    // Determine which model to use based on user characteristics
    const model = await this.determineTimelineModel(userId);
    
    let result: TimelineResult;
    
    switch (model) {
      case 'pull':
        result = await this.getPullTimeline(userId, cursor, limit);
        break;
      case 'push':
        result = await this.getPushTimeline(userId, cursor, limit);
        break;
      case 'hybrid':
        result = await this.getHybridTimeline(userId, cursor, limit);
        break;
      default:
        result = await this.getPullTimeline(userId, cursor, limit);
    }
    
    const generationTime = Date.now() - startTime;
    
    return {
      ...result,
      generationTime,
      model
    };
  }

  private async determineTimelineModel(userId: string): Promise<TimelineModel> {
    const userQuery = `
      SELECT follower_count, following_count, created_at 
      FROM users 
      WHERE id = $1
    `;
    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return 'pull'; // Default for unknown users
    }
    
    const user = userResult.rows[0];
    const followerCount = user.follower_count;
    const followingCount = user.following_count;
    
    // Business logic for model selection
    if (followerCount > 10000) {
      return 'pull'; // Celebrities use pull to avoid fanout explosion
    } else if (followingCount < 100 && followerCount < 1000) {
      return 'push'; // Small users get fast push timelines
    } else {
      return 'hybrid'; // Everyone else gets hybrid
    }
  }

  private transformTweetRow(row: any): Tweet {
    return {
      id: row.id,
      userId: row.user_id,
      content: row.content,
      mediaUrls: row.media_urls,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at || row.created_at),
      likes: row.likes,
      retweets: row.retweets,
      replies: row.replies,
      username: row.username,
      displayName: row.display_name,
      isLiked: row.is_liked || false,
      isRetweeted: row.is_retweeted || false
    };
  }

  private async getPullTimeline(userId: string, cursor?: string, limit: number = 20): Promise<TimelineResult> {
    // Get user's following list
    const followingQuery = `
      SELECT following_id FROM follows WHERE follower_id = $1
    `;
    const followingResult = await db.query(followingQuery, [userId]);
    const followingIds = followingResult.rows.map(row => row.following_id);
    
    if (followingIds.length === 0) {
      return { tweets: [], hasMore: false };
    }

    // Build cursor condition
    let cursorCondition = '';
    let queryParams: any[] = [userId, followingIds, limit + 1];
    
    if (cursor && cursor !== 'undefined') {
      const [timestamp, tweetId] = cursor.split('_');
      if (timestamp && tweetId && timestamp !== 'undefined' && tweetId !== 'undefined') {
        cursorCondition = 'AND (t.created_at < $4 OR (t.created_at = $4 AND t.id < $5))';
        queryParams.push(timestamp, tweetId);
      }
    }

    // Fetch recent tweets from followed users
    const tweetsQuery = `
      SELECT 
        t.id, t.user_id, t.content, t.media_urls, t.created_at, t.likes, t.retweets, t.replies,
        u.username, u.display_name,
        CASE WHEN l.user_id IS NOT NULL THEN true ELSE false END as is_liked,
        CASE WHEN r.user_id IS NOT NULL THEN true ELSE false END as is_retweeted
      FROM tweets t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN likes l ON t.id = l.tweet_id AND l.user_id = $1
      LEFT JOIN retweets r ON t.id = r.tweet_id AND r.user_id = $1
      WHERE t.user_id = ANY($2)
      ${cursorCondition}
      ORDER BY t.created_at DESC, t.id DESC
      LIMIT $3
    `;
    
    const tweetsResult = await db.query(tweetsQuery, queryParams);
    
    const hasMore = tweetsResult.rows.length > limit;
    const tweets = tweetsResult.rows.slice(0, limit).map(row => this.transformTweetRow(row));
    
    let nextCursor;
    if (hasMore && tweets.length > 0) {
      const lastTweet = tweets[tweets.length - 1];
      // Use UTC timestamp without timezone info for PostgreSQL compatibility
      const timestamp = lastTweet.createdAt.toISOString().replace('T', ' ').replace('Z', '');
      nextCursor = `${timestamp}_${lastTweet.id}`;
    }

    return {
      tweets,
      nextCursor,
      hasMore
    };
  }

  private async getPushTimeline(userId: string, cursor?: string, limit: number = 20): Promise<TimelineResult> {
    // Check cache first
    const cacheKey = `timeline:${userId}:${cursor || 'start'}:${limit}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      const cachedResult = JSON.parse(cached);
      // Transform cached tweets to ensure they have proper Date objects
      cachedResult.tweets = cachedResult.tweets.map((tweet: any) => ({
        ...tweet,
        createdAt: new Date(tweet.createdAt),
        updatedAt: new Date(tweet.updatedAt)
      }));
      return cachedResult;
    }

    // Get materialized timeline
    let cursorCondition = '';
    let queryParams: any[] = [userId, limit + 1];
    
    if (cursor && cursor !== 'undefined') {
      const [timestamp, tweetId] = cursor.split('_');
      if (timestamp && tweetId && timestamp !== 'undefined' && tweetId !== 'undefined') {
        cursorCondition = 'AND (tl.created_at < $3 OR (tl.created_at = $3 AND tl.tweet_id < $4))';
        queryParams.push(timestamp, tweetId);
      }
    }

    const timelineQuery = `
      SELECT 
        t.id, t.user_id, t.content, t.media_urls, t.created_at, t.likes, t.retweets, t.replies,
        u.username, u.display_name,
        CASE WHEN l.user_id IS NOT NULL THEN true ELSE false END as is_liked,
        CASE WHEN r.user_id IS NOT NULL THEN true ELSE false END as is_retweeted
      FROM timeline tl
      JOIN tweets t ON tl.tweet_id = t.id
      JOIN users u ON t.user_id = u.id
      LEFT JOIN likes l ON t.id = l.tweet_id AND l.user_id = $1
      LEFT JOIN retweets r ON t.id = r.tweet_id AND r.user_id = $1
      WHERE tl.user_id = $1
      ${cursorCondition}
      ORDER BY tl.created_at DESC, tl.tweet_id DESC
      LIMIT $2
    `;

    const result = await db.query(timelineQuery, queryParams);
    
    const hasMore = result.rows.length > limit;
    const tweets = result.rows.slice(0, limit).map(row => this.transformTweetRow(row));
    
    let nextCursor;
    if (hasMore && tweets.length > 0) {
      const lastTweet = tweets[tweets.length - 1];
      // Use UTC timestamp without timezone info for PostgreSQL compatibility
      const timestamp = lastTweet.createdAt.toISOString().replace('T', ' ').replace('Z', '');
      nextCursor = `${timestamp}_${lastTweet.id}`;
    }

    const response = {
      tweets,
      nextCursor,
      hasMore
    };

    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(response), 300);
    
    return response;
  }

  private async getHybridTimeline(userId: string, cursor?: string, limit: number = 20): Promise<TimelineResult> {
    // Get half from materialized timeline (push) and half from real-time (pull)
    const pushLimit = Math.floor(limit / 2);
    const pullLimit = limit - pushLimit;
    
    const [pushResult, pullResult] = await Promise.all([
      this.getPushTimeline(userId, cursor, pushLimit),
      this.getPullTimeline(userId, cursor, pullLimit)
    ]);

    // Merge and sort results
    const allTweets = [...pushResult.tweets, ...pullResult.tweets];
    const uniqueTweets = this.deduplicateTweets(allTweets);
    
    // Ensure all tweets have proper Date objects
    const normalizedTweets = uniqueTweets.map(tweet => ({
      ...tweet,
      createdAt: tweet.createdAt instanceof Date ? tweet.createdAt : new Date(tweet.createdAt),
      updatedAt: tweet.updatedAt instanceof Date ? tweet.updatedAt : new Date(tweet.updatedAt)
    }));
    
    const sortedTweets = normalizedTweets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    const hasMore = pushResult.hasMore || pullResult.hasMore;
    let nextCursor;
    
    if (hasMore && sortedTweets.length > 0) {
      const lastTweet = sortedTweets[sortedTweets.length - 1];
      nextCursor = `${lastTweet.createdAt.toISOString().replace('T', ' ').replace('Z', '')}_${lastTweet.id}`;
    }

    return {
      tweets: sortedTweets,
      nextCursor,
      hasMore
    };
  }

  private deduplicateTweets(tweets: Tweet[]): Tweet[] {
    const seen = new Set();
    return tweets.filter(tweet => {
      if (seen.has(tweet.id)) {
        return false;
      }
      seen.add(tweet.id);
      return true;
    });
  }

  async fanoutTweet(tweetId: string, userId: string): Promise<void> {
    // Get followers
    const followersQuery = `
      SELECT follower_id FROM follows WHERE following_id = $1
    `;
    const followersResult = await db.query(followersQuery, [userId]);
    
    // Get tweet details
    const tweetQuery = `
      SELECT created_at FROM tweets WHERE id = $1
    `;
    const tweetResult = await db.query(tweetQuery, [tweetId]);
    
    if (tweetResult.rows.length === 0) return;
    
    const tweetCreatedAt = tweetResult.rows[0].created_at;
    
    // Insert into each follower's materialized timeline
    const insertPromises = followersResult.rows.map(async (follower) => {
      try {
        await db.query(
          'INSERT INTO timeline (user_id, tweet_id, created_at, rank) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
          [follower.follower_id, tweetId, tweetCreatedAt, Date.now()]
        );
        
        // Invalidate cache
        await this.invalidateTimelineCache(follower.follower_id);
      } catch (error) {
        console.error(`Failed to fanout to user ${follower.follower_id}:`, error);
      }
    });

    await Promise.all(insertPromises);
  }

  private async invalidateTimelineCache(userId: string): Promise<void> {
    // Remove all cached timeline entries for this user
    const pattern = `timeline:${userId}:*`;
    // Note: In production, you'd use SCAN for better performance
    await redis.del(pattern);
  }
}
