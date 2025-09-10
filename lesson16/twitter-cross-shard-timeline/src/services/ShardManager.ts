import { Pool } from 'pg';

export class ShardManager {
  private shards: Pool[] = [];
  private readonly SHARD_COUNT = 10;
  
  constructor() {
    this.initializeShards();
  }

  private initializeShards() {
    for (let i = 0; i < this.SHARD_COUNT; i++) {
      // In production, these would be different database servers
      // For demo, we simulate with different database names
      const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: `twitter_shard_${i}`,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      
      this.shards.push(pool);
      console.log(`📊 Initialized shard ${i}`);
    }
  }

  getShardForUser(userId: string): number {
    // Consistent hashing based on user ID
    const hash = this.hashString(userId);
    return hash % this.SHARD_COUNT;
  }

  identifyShards(userIds: string[]): number[] {
    const shardSet = new Set<number>();
    userIds.forEach(userId => {
      shardSet.add(this.getShardForUser(userId));
    });
    return Array.from(shardSet).sort();
  }

  async query(shardId: number, sql: string, params: any[] = []): Promise<any[]> {
    try {
      const client = await this.shards[shardId].connect();
      try {
        const result = await client.query(sql, params);
        return result.rows;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`❌ Shard ${shardId} query failed:`, error);
      // Return empty results for failed shards to enable graceful degradation
      return [];
    }
  }

  async getShardStatus() {
    const statusPromises = this.shards.map(async (shard, index) => {
      try {
        const client = await shard.connect();
        const result = await client.query('SELECT COUNT(*) as tweet_count FROM tweets');
        client.release();
        
        return {
          shardId: index,
          status: 'healthy',
          tweetCount: parseInt(result.rows[0].tweet_count),
          totalConnections: shard.totalCount,
          idleConnections: shard.idleCount
        };
      } catch (error) {
        return {
          shardId: index,
          status: 'unhealthy',
          error: error instanceof Error ? error.message : String(error),
          tweetCount: 0,
          totalConnections: 0,
          idleConnections: 0
        };
      }
    });

    return await Promise.all(statusPromises);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
