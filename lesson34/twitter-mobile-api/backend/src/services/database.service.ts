import Database from 'better-sqlite3';
import { Tweet } from '../../../shared/types';

export class DatabaseService {
  private db: Database.Database;
  
  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.initializeSchema();
    this.seedData();
  }
  
  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tweets (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        author_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_avatar TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        likes_count INTEGER DEFAULT 0,
        retweets_count INTEGER DEFAULT 0,
        replies_count INTEGER DEFAULT 0,
        media_urls TEXT,
        deleted INTEGER DEFAULT 0
      );
      
      CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON tweets(created_at);
      CREATE INDEX IF NOT EXISTS idx_tweets_updated_at ON tweets(updated_at);
      CREATE INDEX IF NOT EXISTS idx_tweets_author_id ON tweets(author_id);
      
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_push_user_id ON push_subscriptions(user_id);
    `);
  }
  
  private seedData(): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO tweets 
      (id, content, author_id, author_name, created_at, updated_at, likes_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = Date.now();
    const tweets = [
      ['1', 'Mobile APIs need to be optimized for bandwidth and battery', 'user1', 'Alice', now - 3600000, now - 3600000, 42],
      ['2', 'Delta sync reduces data transfer by 60-80%', 'user2', 'Bob', now - 3000000, now - 3000000, 28],
      ['3', 'Offline-first architecture is the future', 'user1', 'Alice', now - 2400000, now - 2400000, 35],
      ['4', 'Push notifications must balance real-time with battery life', 'user3', 'Charlie', now - 1800000, now - 1800000, 51],
      ['5', 'Request batching saves battery by reducing radio activations', 'user2', 'Bob', now - 1200000, now - 1200000, 19]
    ];
    
    tweets.forEach(tweet => stmt.run(...tweet));
  }
  
  getTweetsSince(since: number, limit: number = 20): Tweet[] {
    const stmt = this.db.prepare(`
      SELECT 
        id, content, author_id as authorId, author_name as authorName,
        author_avatar as authorAvatar, created_at as createdAt,
        updated_at as updatedAt, likes_count as likesCount,
        retweets_count as retweetsCount, replies_count as repliesCount,
        media_urls as mediaUrls
      FROM tweets
      WHERE updated_at > ? AND deleted = 0
      ORDER BY updated_at DESC
      LIMIT ?
    `);
    
    return stmt.all(since, limit) as Tweet[];
  }
  
  getDeletedTweetsSince(since: number): string[] {
    const stmt = this.db.prepare(`
      SELECT id FROM tweets
      WHERE updated_at > ? AND deleted = 1
    `);
    
    return stmt.all(since).map((row: any) => row.id);
  }
  
  createTweet(tweet: Omit<Tweet, 'id'>): Tweet {
    const id = `tweet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const stmt = this.db.prepare(`
      INSERT INTO tweets 
      (id, content, author_id, author_name, created_at, updated_at, likes_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      tweet.content,
      tweet.authorId,
      tweet.authorName,
      now,
      now,
      0
    );
    
    return { id, ...tweet, createdAt: now, updatedAt: now, likesCount: 0, retweetsCount: 0, repliesCount: 0 };
  }
  
  likeTweet(tweetId: string): void {
    const stmt = this.db.prepare(`
      UPDATE tweets 
      SET likes_count = likes_count + 1, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(Date.now(), tweetId);
  }
  
  deleteTweet(tweetId: string): void {
    const stmt = this.db.prepare(`
      UPDATE tweets 
      SET deleted = 1, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(Date.now(), tweetId);
  }
  
  savePushSubscription(userId: string, subscription: any): void {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const stmt = this.db.prepare(`
      INSERT INTO push_subscriptions 
      (id, user_id, endpoint, p256dh, auth, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      userId,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      Date.now()
    );
  }
  
  getUserSubscriptions(userId: string): any[] {
    const stmt = this.db.prepare(`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE user_id = ?
    `);
    
    return stmt.all(userId);
  }
  
  close(): void {
    this.db.close();
  }
}
