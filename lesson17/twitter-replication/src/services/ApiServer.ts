import express from 'express';
import cors from 'cors';
import { databaseService } from './DatabaseService.js';

export class ApiServer {
  private app = express();
  private port = process.env.PORT || 5000;

  constructor() {
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('dist'));
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/api/health', async (_req, res) => {
      try {
        const stats = databaseService.getStats();
        res.json({ status: 'healthy', database: stats });
      } catch (error) {
        res.status(500).json({ status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Get all tweets (read from slaves)
    this.app.get('/api/tweets', async (_req, res) => {
      try {
        const result = await databaseService.executeQuery(`
          SELECT t.*, u.username 
          FROM tweets t 
          JOIN users u ON t.user_id = u.id 
          ORDER BY t.created_at DESC 
          LIMIT 50
        `, [], { readOnly: true });
        
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Get user timeline (read from slaves)
    this.app.get('/api/users/:userId/timeline', async (req, res) => {
      try {
        const { userId } = req.params;
        const result = await databaseService.executeQuery(`
          SELECT t.*, u.username 
          FROM tweets t 
          JOIN users u ON t.user_id = u.id 
          JOIN user_followers f ON (t.user_id = f.following_id OR t.user_id = $1)
          WHERE f.follower_id = $1 OR t.user_id = $1
          ORDER BY t.created_at DESC 
          LIMIT 20
        `, [userId], { readOnly: true });
        
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Create new tweet (write to master)
    this.app.post('/api/tweets', async (req, res) => {
      try {
        const { user_id, content } = req.body;
        
        const result = await databaseService.executeQuery(`
          INSERT INTO tweets (user_id, content) 
          VALUES ($1, $2) 
          RETURNING *
        `, [user_id, content], { preferMaster: true });
        
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Get users (read from master to ensure we have the latest users for tweet creation)
    this.app.get('/api/users', async (_req, res) => {
      try {
        const result = await databaseService.executeQuery(`
          SELECT * FROM users ORDER BY created_at DESC
        `, [], { preferMaster: true });
        
        res.json(result.rows);
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Test endpoint to debug database connection
    this.app.get('/api/debug', async (_req, res) => {
      try {
        // Test basic connection
        const basicTest = await databaseService.executeOnMaster('SELECT 1 as test', []);
        
        // Test database name
        const dbTest = await databaseService.executeOnMaster('SELECT current_database()', []);
        
        // Test table existence
        const tableTest = await databaseService.executeOnMaster(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name
        `, []);
        
        // Test actual counts - force master connection (without followers for now)
        const countTest = await databaseService.executeOnMaster(`
          SELECT 
            (SELECT count(*) FROM tweets) as tweet_count,
            (SELECT count(*) FROM users) as user_count
        `, []);
        
        res.json({
          basic: basicTest.rows[0],
          database: dbTest.rows[0],
          tables: tableTest.rows,
          counts: countTest.rows[0]
        });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });
    this.app.get('/api/stats', async (_req, res) => {
      try {
        const stats = databaseService.getStats();
        
        // Test connection first
        const connectionTest = await databaseService.executeOnMaster('SELECT current_database(), current_user', []);
        
        // Get additional database metrics - force master connection
        const masterMetrics = await databaseService.executeOnMaster(`
          SELECT 
            (SELECT count(*) FROM tweets) as total_tweets,
            (SELECT count(*) FROM users) as total_users
        `, []);
        
        res.json({
          ...stats,
          connection: connectionTest.rows[0],
          metrics: masterMetrics.rows[0]
        });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Test endpoint to verify database connection and data
    this.app.get('/api/test-db', async (_req, res) => {
      try {
        const users = await databaseService.executeOnMaster('SELECT id, username FROM users ORDER BY id', []);
        const tweets = await databaseService.executeOnMaster('SELECT id, user_id, content FROM tweets ORDER BY id', []);
        
        res.json({
          users: users.rows,
          tweets: tweets.rows,
          userCount: users.rows.length,
          tweetCount: tweets.rows.length
        });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Initialize database with test data if empty
    this.app.post('/api/init-db', async (_req, res) => {
      try {
        // Check if users exist
        const userCount = await databaseService.executeOnMaster('SELECT COUNT(*) as count FROM users', []);
        
        if (parseInt(userCount.rows[0].count) === 0) {
          // Insert test users
          await databaseService.executeOnMaster(`
            INSERT INTO users (username, email, created_at, updated_at) VALUES 
            ('alice', 'alice@twitter.com', NOW(), NOW()),
            ('bob', 'bob@twitter.com', NOW(), NOW()),
            ('charlie', 'charlie@twitter.com', NOW(), NOW())
          `, []);
          
          // Insert test tweets
          await databaseService.executeOnMaster(`
            INSERT INTO tweets (user_id, content, created_at, updated_at) VALUES 
            (1, 'Hello from master database! This is my first tweet.', NOW(), NOW()),
            (2, 'Learning about database replication is fascinating!', NOW(), NOW()),
            (3, 'Building scalable systems one lesson at a time.', NOW(), NOW())
          `, []);
          
          res.json({ message: 'Database initialized with test data' });
        } else {
          res.json({ message: 'Database already has data' });
        }
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 API Server running on port ${this.port}`);
      console.log(`📊 Health check: http://localhost:${this.port}/api/health`);
    });
  }
}
