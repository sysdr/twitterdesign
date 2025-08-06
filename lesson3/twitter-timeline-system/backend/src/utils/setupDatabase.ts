import { db } from '../services/database.js';

export async function setupDatabase() {
  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        follower_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        bio TEXT,
        avatar_url VARCHAR(512),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create tweets table
    await db.query(`
      CREATE TABLE IF NOT EXISTS tweets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        media_urls TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        likes INTEGER DEFAULT 0,
        retweets INTEGER DEFAULT 0,
        replies INTEGER DEFAULT 0
      )
    `);

    // Create follows table
    await db.query(`
      CREATE TABLE IF NOT EXISTS follows (
        follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (follower_id, following_id)
      )
    `);

    // Create timeline table (materialized timelines)
    await db.query(`
      CREATE TABLE IF NOT EXISTS timeline (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        tweet_id UUID REFERENCES tweets(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL,
        rank BIGINT NOT NULL,
        PRIMARY KEY (user_id, tweet_id)
      )
    `);

    // Create likes table
    await db.query(`
      CREATE TABLE IF NOT EXISTS likes (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        tweet_id UUID REFERENCES tweets(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, tweet_id)
      )
    `);

    // Create retweets table
    await db.query(`
      CREATE TABLE IF NOT EXISTS retweets (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        tweet_id UUID REFERENCES tweets(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, tweet_id)
      )
    `);

    // Create indexes for performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_tweets_user_id_created_at ON tweets(user_id, created_at DESC)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at DESC)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_timeline_user_id_created_at ON timeline(user_id, created_at DESC)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id)');

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
}

export async function seedDatabase() {
  try {
    // Create demo users
    const users = [
      { username: 'alice_dev', displayName: 'Alice Developer', email: 'alice@example.com', followerCount: 150, followingCount: 75 },
      { username: 'bob_tech', displayName: 'Bob Tech', email: 'bob@example.com', followerCount: 12000, followingCount: 200 },
      { username: 'charlie_code', displayName: 'Charlie Coder', email: 'charlie@example.com', followerCount: 500, followingCount: 300 },
      { username: 'demo_user', displayName: 'Demo User', email: 'demo@example.com', followerCount: 50, followingCount: 100 }
    ];

    const userIds: string[] = [];
    
    for (const user of users) {
      // Try to insert the user, and if they already exist, get their ID
      let result = await db.query(`
        INSERT INTO users (username, display_name, email, password_hash, follower_count, following_count)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (username) DO NOTHING
        RETURNING id
      `, [user.username, user.displayName, user.email, 'dummy_hash', user.followerCount, user.followingCount]);
      
      if (result.rows.length === 0) {
        // User already exists, get their ID
        result = await db.query('SELECT id FROM users WHERE username = $1', [user.username]);
      }
      
      if (result.rows.length > 0) {
        userIds.push(result.rows[0].id);
      }
    }

    // Create follow relationships
    if (userIds.length >= 4) {
      const followRelations = [
        [userIds[3], userIds[0]], // demo_user follows alice
        [userIds[3], userIds[1]], // demo_user follows bob
        [userIds[3], userIds[2]], // demo_user follows charlie
        [userIds[0], userIds[1]], // alice follows bob
        [userIds[2], userIds[1]], // charlie follows bob
      ];

      for (const [followerId, followingId] of followRelations) {
        await db.query(`
          INSERT INTO follows (follower_id, following_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [followerId, followingId]);
      }
    }

    // Create sample tweets
    const tweets = [
      { userId: userIds[0], content: 'Just shipped a new React component! TypeScript makes everything so much cleaner 🚀' },
      { userId: userIds[1], content: 'Hot take: Timeline generation is the most underrated system design problem. The complexity is mind-blowing!' },
      { userId: userIds[2], content: 'Working on database sharding strategies. Anyone have experience with consistent hashing in production?' },
      { userId: userIds[0], content: 'TIL: Redis pub/sub can handle way more throughput than I expected. Great for real-time features!' },
      { userId: userIds[1], content: 'Pro tip: Always test your fanout algorithms with celebrity user scenarios. That\'s where systems break.' },
      { userId: userIds[2], content: 'Successfully implemented pagination with cursors instead of offsets. Performance improved by 10x!' },
      { userId: userIds[0], content: 'Code review is like timeline generation - everyone has an opinion on the best approach 😄' },
      { userId: userIds[1], content: 'Building systems that scale to millions of users is 90% about smart caching strategies.' },
    ];

    const tweetIds: string[] = [];
    
    for (const tweet of tweets) {
      const result = await db.query(`
        INSERT INTO tweets (user_id, content, likes, retweets, replies)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [tweet.userId, tweet.content, Math.floor(Math.random() * 50), Math.floor(Math.random() * 20), Math.floor(Math.random() * 10)]);
      
      tweetIds.push(result.rows[0].id);
    }

    // Populate timeline entries for push model
    if (userIds.length >= 4 && tweetIds.length > 0) {
      const timelineService = new (await import('../services/timelineService.js')).TimelineService();
      
      // Fanout tweets to followers' timelines
      for (const tweetId of tweetIds) {
        // Get the user who created the tweet
        const tweetResult = await db.query('SELECT user_id FROM tweets WHERE id = $1', [tweetId]);
        if (tweetResult.rows.length > 0) {
          const tweetUserId = tweetResult.rows[0].user_id;
          await timelineService.fanoutTweet(tweetId, tweetUserId);
        }
      }
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  }
}
