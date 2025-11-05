import { Router } from 'express';
import { DatabaseService } from '../services/database.service';
import { DeltaSyncService } from '../services/delta-sync.service';
import { PushService } from '../services/push.service';
import { BatchService } from '../services/batch.service';

export function createApiRoutes(
  db: DatabaseService,
  deltaSync: DeltaSyncService,
  pushService: PushService,
  batchService: BatchService
): Router {
  const router = Router();
  
  // Delta sync endpoint
  router.get('/timeline/delta', async (req, res) => {
    try {
      const lastSyncTime = parseInt(req.query.lastSyncTime as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const delta = await deltaSync.getTimelineDelta(lastSyncTime, limit);
      
      // Add headers for monitoring
      res.set('X-Delta-Added', delta.added.length.toString());
      res.set('X-Delta-Modified', delta.modified.length.toString());
      res.set('X-Delta-Deleted', delta.deleted.length.toString());
      
      res.json(delta);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Full timeline (for comparison)
  router.get('/timeline/full', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const tweets = db.getTweetsSince(0, limit);
      
      res.json({
        tweets,
        syncTime: Date.now()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create tweet
  router.post('/tweets', async (req, res) => {
    try {
      const { content, authorId, authorName } = req.body;
      
      if (!content || !authorId || !authorName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const tweet = db.createTweet({
        content,
        authorId,
        authorName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        likesCount: 0,
        retweetsCount: 0,
        repliesCount: 0
      });
      
      // Send push notification to followers
      await pushService.broadcastNotification({
        title: `New tweet from ${authorName}`,
        body: content.substring(0, 100),
        data: { tweetId: tweet.id }
      });
      
      res.status(201).json(tweet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Like tweet
  router.post('/tweets/:id/like', async (req, res) => {
    try {
      const { id } = req.params;
      db.likeTweet(id);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete tweet
  router.delete('/tweets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      db.deleteTweet(id);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Push subscription
  router.post('/push/subscribe', async (req, res) => {
    try {
      const { userId, subscription } = req.body;
      
      await pushService.subscribe(userId, subscription);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Batch operations
  router.post('/batch', async (req, res) => {
    try {
      const batchRequest = req.body;
      const batchResponse = await batchService.processBatch(batchRequest);
      
      res.json(batchResponse);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Health check
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime()
    });
  });
  
  return router;
}
