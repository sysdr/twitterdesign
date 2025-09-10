import { ShardManager } from './ShardManager';
import { CacheManager } from './CacheManager';
import { Tweet, TimelineEntry } from '../models/Timeline';

export class TimelineService {
  private metrics = {
    totalQueries: 0,
    avgLatency: 0,
    cacheHits: 0,
    shardFailures: 0
  };

  constructor(
    private shardManager: ShardManager,
    private cacheManager: CacheManager
  ) {}

  async generateTimeline(userId: string, limit: number, offset: number): Promise<TimelineEntry[]> {
    const startTime = Date.now();
    this.metrics.totalQueries++;

    try {
      // Check cache first
      const cacheKey = `timeline:${userId}:${limit}:${offset}`;
      const cachedTimeline = await this.cacheManager.get(cacheKey);
      
      if (cachedTimeline) {
        this.metrics.cacheHits++;
        console.log(`📋 Cache hit for user ${userId}`);
        return JSON.parse(cachedTimeline);
      }

      // Get user's followed users to determine relevant shards
      const followedUsers = await this.getUserFollows(userId);
      const relevantShards = this.shardManager.identifyShards(followedUsers);
      
      console.log(`🎯 Querying ${relevantShards.length} shards for user ${userId}`);
      
      // Query all relevant shards in parallel
      const shardPromises = relevantShards.map(shardId => 
        this.queryShardTimeline(shardId, followedUsers, limit + offset)
      );
      
      const shardResults = await Promise.allSettled(shardPromises);
      
      // Collect successful results and log failures
      const validResults: Tweet[][] = [];
      shardResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          validResults.push(result.value);
        } else {
          this.metrics.shardFailures++;
          console.warn(`❌ Shard ${relevantShards[index]} query failed:`, result.reason);
        }
      });

      // Merge and sort results from all shards
      const mergedTimeline = this.mergeShardResults(validResults);
      
      // Apply pagination
      const paginatedTimeline = mergedTimeline.slice(offset, offset + limit);
      
      // Convert to timeline entries with metadata
      const timelineEntries = paginatedTimeline.map(tweet => ({
        ...tweet,
        shardId: this.shardManager.getShardForUser(tweet.userId),
        retrievedAt: new Date().toISOString()
      }));

      // Cache the result
      await this.cacheManager.set(cacheKey, JSON.stringify(timelineEntries), 300); // 5 min cache

      // Update metrics
      const latency = Date.now() - startTime;
      this.metrics.avgLatency = (this.metrics.avgLatency + latency) / 2;
      
      console.log(`✅ Timeline generated for user ${userId} in ${latency}ms`);
      return timelineEntries;

    } catch (error) {
      console.error(`❌ Timeline generation failed for user ${userId}:`, error);
      throw error;
    }
  }

  private async getUserFollows(userId: string): Promise<string[]> {
    // Simulate getting user's follow list from user shard
    const userShard = this.shardManager.getShardForUser(userId);
    const follows = await this.shardManager.query(userShard, 
      `SELECT followed_user_id FROM follows WHERE follower_id = $1`, [userId]);
    return follows.map((row: any) => row.followed_user_id);
  }

  private async queryShardTimeline(shardId: number, userIds: string[], limit: number): Promise<Tweet[]> {
    const query = `
      SELECT id, user_id, content, created_at, likes_count, retweets_count
      FROM tweets 
      WHERE user_id = ANY($1)
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const results = await this.shardManager.query(shardId, query, [userIds, limit]);
    return results.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      content: row.content,
      createdAt: row.created_at,
      likesCount: row.likes_count,
      retweetsCount: row.retweets_count
    }));
  }

  private mergeShardResults(shardResults: Tweet[][]): Tweet[] {
    // K-way merge of sorted arrays (each shard returns chronologically sorted tweets)
    if (shardResults.length === 0) return [];
    if (shardResults.length === 1) return shardResults[0];

    // Use priority queue approach for efficient K-way merge
    const pointers = new Array(shardResults.length).fill(0);
    const merged: Tweet[] = [];
    
    while (true) {
      let latestTweet: Tweet | null = null;
      let latestIndex = -1;
      
      // Find the most recent tweet across all shard results
      for (let i = 0; i < shardResults.length; i++) {
        if (pointers[i] < shardResults[i].length) {
          const tweet = shardResults[i][pointers[i]];
          if (!latestTweet || new Date(tweet.createdAt) > new Date(latestTweet.createdAt)) {
            latestTweet = tweet;
            latestIndex = i;
          }
        }
      }
      
      if (latestIndex === -1) break; // No more tweets
      
      merged.push(latestTweet!);
      pointers[latestIndex]++;
    }
    
    return merged;
  }

  async getPerformanceMetrics() {
    return {
      ...this.metrics,
      shardStatus: await this.shardManager.getShardStatus(),
      cacheStats: await this.cacheManager.getStats()
    };
  }
}
