import { Database } from 'sqlite3';
import { User, Tweet, ShardInfo, CreateUserInput, CreateTweetInput } from '../../types';
import path from 'path';

export class DatabaseService {
  private connections: Map<number, Database> = new Map();
  private shards: ShardInfo[] = [];

  constructor(shards: ShardInfo[]) {
    this.shards = shards;
    this.initializeShards();
  }

  private async initializeShards(): Promise<void> {
    for (const shard of this.shards) {
      const dbPath = path.join(process.cwd(), `data/shard_${shard.id}.db`);
      const db = new Database(dbPath);
      
      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          followers INTEGER DEFAULT 0,
          following INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS tweets (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          likes INTEGER DEFAULT 0,
          retweets INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        db.run(`CREATE INDEX IF NOT EXISTS idx_user_id ON tweets(user_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON tweets(created_at)`);
      });

      this.connections.set(shard.id, db);
    }
  }

  public async createUser(user: CreateUserInput, shardId: number): Promise<User> {
    const db = this.connections.get(shardId);
    if (!db) throw new Error(`Shard ${shardId} not available`);

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`INSERT INTO users (id, username, email, followers, following) VALUES (?, ?, ?, ?, ?)`);
      stmt.run([user.id, user.username, user.email, user.followers, user.following], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          ...user,
          created_at: new Date(),
          shard_id: shardId
        });
      });
      stmt.finalize();
    });
  }

  public async createTweet(tweet: CreateTweetInput, shardId: number): Promise<Tweet> {
    const db = this.connections.get(shardId);
    if (!db) throw new Error(`Shard ${shardId} not available`);

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`INSERT INTO tweets (id, user_id, content, likes, retweets) VALUES (?, ?, ?, ?, ?)`);
      stmt.run([tweet.id, tweet.user_id, tweet.content, tweet.likes, tweet.retweets], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          ...tweet,
          created_at: new Date(),
          shard_id: shardId
        });
      });
      stmt.finalize();
    });
  }

  public async getUserById(userId: string, shardId: number): Promise<User | null> {
    const db = this.connections.get(shardId);
    if (!db) throw new Error(`Shard ${shardId} not available`);

    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }

        resolve({
          id: row.id,
          username: row.username,
          email: row.email,
          followers: row.followers,
          following: row.following,
          created_at: new Date(row.created_at),
          shard_id: shardId
        });
      });
    });
  }

  public async getUserTweets(userId: string, shardId: number, limit: number = 20): Promise<Tweet[]> {
    const db = this.connections.get(shardId);
    if (!db) throw new Error(`Shard ${shardId} not available`);

    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM tweets WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`, 
        [userId, limit], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }
        
        const tweets = rows.map(row => ({
          id: row.id,
          user_id: row.user_id,
          content: row.content,
          likes: row.likes,
          retweets: row.retweets,
          created_at: new Date(row.created_at),
          shard_id: shardId
        }));

        resolve(tweets);
      });
    });
  }

  public async getShardStats(shardId: number): Promise<{ user_count: number, tweet_count: number }> {
    const db = this.connections.get(shardId);
    if (!db) throw new Error(`Shard ${shardId} not available`);

    return new Promise((resolve, reject) => {
      db.get(`SELECT 
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM tweets) as tweet_count
      `, (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          user_count: row.user_count || 0,
          tweet_count: row.tweet_count || 0
        });
      });
    });
  }
}
