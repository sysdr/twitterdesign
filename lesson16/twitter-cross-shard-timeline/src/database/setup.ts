import { Pool } from 'pg';

export async function setupShardedDatabases() {
  const SHARD_COUNT = 10;
  
  for (let shardId = 0; shardId < SHARD_COUNT; shardId++) {
    try {
      const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: 'postgres', // Connect to default DB to create shard DBs
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
      });

      // Create shard database
      const dbName = `twitter_shard_${shardId}`;
      await pool.query(`CREATE DATABASE ${dbName}`);
      
      // Connect to the new shard database
      const shardPool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: dbName,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
      });

      // Create tables in shard
      await shardPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await shardPool.query(`
        CREATE TABLE IF NOT EXISTS tweets (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          likes_count INTEGER DEFAULT 0,
          retweets_count INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);

      await shardPool.query(`
        CREATE TABLE IF NOT EXISTS follows (
          follower_id VARCHAR(255) NOT NULL,
          followed_user_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (follower_id, followed_user_id),
          FOREIGN KEY (follower_id) REFERENCES users(id),
          FOREIGN KEY (followed_user_id) REFERENCES users(id)
        );
      `);

      // Create indexes for performance
      await shardPool.query(`CREATE INDEX IF NOT EXISTS idx_tweets_user_id_created ON tweets(user_id, created_at DESC);`);
      await shardPool.query(`CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);`);
      
      // Generate sample data for this shard
      await generateSampleData(shardPool, shardId);
      
      await shardPool.end();
      await pool.end();
      
      console.log(`✅ Shard ${shardId} database setup complete`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`📊 Shard ${shardId} database already exists`);
      } else {
        console.error(`❌ Error setting up shard ${shardId}:`, error);
      }
    }
  }
}

async function generateSampleData(pool: Pool, shardId: number) {
  const usersPerShard = 100;
  const tweetsPerUser = 20;
  
  // Generate users for this shard
  for (let i = 0; i < usersPerShard; i++) {
    const userId = `user_${shardId}_${i}`;
    await pool.query(
      'INSERT INTO users (id, username, email) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [userId, `user${shardId}_${i}`, `user${shardId}_${i}@example.com`]
    );
    
    // Generate tweets for each user
    for (let j = 0; j < tweetsPerUser; j++) {
      const tweetId = `tweet_${shardId}_${i}_${j}`;
      const content = `This is tweet ${j} from user ${i} in shard ${shardId} #TwitterClone #DistributedSystems`;
      const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random within last week
      
      await pool.query(
        'INSERT INTO tweets (id, user_id, content, created_at, likes_count, retweets_count) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
        [tweetId, userId, content, createdAt, Math.floor(Math.random() * 100), Math.floor(Math.random() * 50)]
      );
    }
  }
  
  // Generate follow relationships
  for (let i = 0; i < usersPerShard; i++) {
    const followerId = `user_${shardId}_${i}`;
    
    // Each user follows some users from other shards (cross-shard relationships)
    for (let targetShard = 0; targetShard < 10; targetShard++) {
      if (targetShard !== shardId) {
        const followedUserId = `user_${targetShard}_${Math.floor(Math.random() * usersPerShard)}`;
        await pool.query(
          'INSERT INTO follows (follower_id, followed_user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [followerId, followedUserId]
        );
      }
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  setupShardedDatabases().then(() => {
    console.log('🎯 All shards setup complete!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}
