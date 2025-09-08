import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { ShardRouter } from './services/shard-router/ShardRouter';
import { DatabaseService } from './services/database/DatabaseService';
import { RebalancerService } from './services/rebalancer/RebalancerService';
import { ShardInfo } from './types';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize services
const initialShards: ShardInfo[] = [
  { id: 1, name: 'shard-1', host: 'localhost', port: 5432, status: 'healthy', load_percentage: 45, user_count: 0, tweet_count: 0, last_health_check: new Date() },
  { id: 2, name: 'shard-2', host: 'localhost', port: 5433, status: 'healthy', load_percentage: 60, user_count: 0, tweet_count: 0, last_health_check: new Date() },
  { id: 3, name: 'shard-3', host: 'localhost', port: 5434, status: 'healthy', load_percentage: 30, user_count: 0, tweet_count: 0, last_health_check: new Date() },
  { id: 4, name: 'shard-4', host: 'localhost', port: 5435, status: 'healthy', load_percentage: 85, user_count: 0, tweet_count: 0, last_health_check: new Date() }
];

const shardRouter = new ShardRouter(initialShards);
const databaseService = new DatabaseService(initialShards);
const rebalancerService = new RebalancerService(shardRouter, databaseService);

// API Routes
app.get('/api/shards', async (_req, res) => {
  const shards = shardRouter.getAllShards();
  
  // Update with real stats
  const shardsWithStats = await Promise.all(
    shards.map(async shard => {
      try {
        const stats = await databaseService.getShardStats(shard.id);
        return {
          ...shard,
          user_count: stats.user_count,
          tweet_count: stats.tweet_count,
          load_percentage: Math.min((stats.user_count / 1000) * 100, 100),
          last_health_check: new Date()
        };
      } catch {
        return { ...shard, status: 'offline' as const };
      }
    })
  );

  const stats = {
    total_shards: shardsWithStats.length,
    healthy_shards: shardsWithStats.filter(s => s.status === 'healthy').length,
    total_users: shardsWithStats.reduce((sum, s) => sum + s.user_count, 0),
    total_tweets: shardsWithStats.reduce((sum, s) => sum + s.tweet_count, 0),
    average_load: shardsWithStats.reduce((sum, s) => sum + s.load_percentage, 0) / shardsWithStats.length,
    hot_shards: shardsWithStats.filter(s => s.load_percentage > 75)
  };

  res.json({ shards: shardsWithStats, stats });
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = uuidv4();
    const shardId = shardRouter.getShardId(userId);
    
    const user = await databaseService.createUser({
      id: userId,
      username,
      email,
      followers: Math.floor(Math.random() * 10000),
      following: Math.floor(Math.random() * 500)
    }, shardId);

    res.json({ user, shard_id: shardId });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/tweets', async (req, res) => {
  try {
    const { user_id, content } = req.body;
    const tweetId = uuidv4();
    const shardId = shardRouter.getShardId(user_id);
    
    const tweet = await databaseService.createTweet({
      id: tweetId,
      user_id,
      content,
      likes: 0,
      retweets: 0
    }, shardId);

    res.json({ tweet, shard_id: shardId });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const shardId = shardRouter.getShardId(userId);
    const user = await databaseService.getUserById(userId, shardId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user, shard_id: shardId });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/rebalance/hot-shards', async (_req, res) => {
  try {
    const hotShards = await rebalancerService.detectHotShards();
    res.json({ hot_shards: hotShards });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/rebalance/auto', async (_req, res) => {
  try {
    const operationIds = await rebalancerService.autoRebalance();
    res.json({ operation_ids: operationIds, message: `Started ${operationIds.length} rebalancing operations` });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/rebalance/operations', (_req, res) => {
  const operations = rebalancerService.getAllOperations();
  res.json({ operations });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Sharding API server running on port ${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:3000`);
});
