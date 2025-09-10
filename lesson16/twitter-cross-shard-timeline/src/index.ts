import express from 'express';
import cors from 'cors';
import { TimelineService } from './services/TimelineService';
import { ShardManager } from './services/ShardManager';
import { CacheManager } from './services/CacheManager';
import { WebSocketManager } from './services/WebSocketManager';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize services
const shardManager = new ShardManager();
const cacheManager = new CacheManager();
const timelineService = new TimelineService(shardManager, cacheManager);
const wsManager = new WebSocketManager();

// Timeline endpoints
app.get('/api/timeline/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    console.log(`🔄 Generating timeline for user ${userId}`);
    const timeline = await timelineService.generateTimeline(
      userId, 
      Number(limit), 
      Number(offset)
    );
    
    res.json({ success: true, data: timeline });
  } catch (error) {
    console.error('Timeline generation error:', error);
    res.status(500).json({ success: false, error: 'Timeline generation failed' });
  }
});

// Shard status endpoint
app.get('/api/shards/status', async (req, res) => {
  try {
    const status = await shardManager.getShardStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get shard status' });
  }
});

// Performance metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const metrics = await timelineService.getPerformanceMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get metrics' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`🌐 Cross-Shard Timeline Service running on port ${PORT}`);
});

// Initialize WebSocket server
wsManager.initialize(server);

export { app };
