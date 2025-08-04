import express from 'express';
import multer from 'multer';
import { TweetModel } from '../models/Tweet';
import { CreateTweetRequest, UpdateTweetRequest } from '../../types/tweet';

const router = express.Router();

// Configure multer for media uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    cb(null, allowedMimes.includes(file.mimetype));
  }
});

// POST /api/tweets - Create new tweet
router.post('/', upload.array('media', 4), async (req, res) => {
  try {
    const startTime = Date.now();
    
    const { content, authorId, authorUsername, parentTweetId } = req.body;
    
    if (!content || !authorId || !authorUsername) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: content, authorId, authorUsername'
      });
    }

    if (content.length > 280) {
      return res.status(400).json({
        success: false,
        error: 'Tweet content exceeds 280 characters'
      });
    }

    // Handle media files (simulate upload to object storage)
    const mediaUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        // In production, upload to S3/CloudFront
        const mediaUrl = `https://media.twitter-clone.com/${Date.now()}-${file.originalname}`;
        mediaUrls.push(mediaUrl);
      }
    }

    const tweet = await TweetModel.create({
      content,
      authorId,
      authorUsername,
      authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorUsername}`,
      mediaUrls,
      parentTweetId,
      isRetweet: false
    });

    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: tweet,
      timestamp: new Date(),
      responseTime: `${responseTime}ms`
    });
  } catch (error) {
    console.error('Error creating tweet:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/tweets - Get tweets with filters
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    const filters = {
      authorId: req.query.authorId as string,
      hashtag: req.query.hashtag as string,
      hasMedia: req.query.hasMedia === 'true',
      limit: parseInt(req.query.limit as string) || 20,
      offset: parseInt(req.query.offset as string) || 0
    };

    const tweets = await TweetModel.findAll(filters);
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        items: tweets,
        total: tweets.length,
        page: Math.floor(filters.offset / filters.limit) + 1,
        limit: filters.limit,
        hasMore: tweets.length === filters.limit
      },
      timestamp: new Date(),
      responseTime: `${responseTime}ms`
    });
  } catch (error) {
    console.error('Error fetching tweets:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/tweets/:id - Get specific tweet
router.get('/:id', async (req, res) => {
  try {
    const startTime = Date.now();
    const tweet = await TweetModel.findById(req.params.id);
    
    if (!tweet) {
      return res.status(404).json({
        success: false,
        error: 'Tweet not found'
      });
    }

    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: tweet,
      timestamp: new Date(),
      responseTime: `${responseTime}ms`
    });
  } catch (error) {
    console.error('Error fetching tweet:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/tweets/:id - Update tweet
router.put('/:id', upload.array('media', 4), async (req, res) => {
  try {
    const startTime = Date.now();
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    if (content.length > 280) {
      return res.status(400).json({
        success: false,
        error: 'Tweet content exceeds 280 characters'
      });
    }

    const tweet = await TweetModel.update(req.params.id, content);
    
    if (!tweet) {
      return res.status(404).json({
        success: false,
        error: 'Tweet not found'
      });
    }

    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: tweet,
      timestamp: new Date(),
      responseTime: `${responseTime}ms`
    });
  } catch (error) {
    console.error('Error updating tweet:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/tweets/:id/engagement - Update engagement
router.post('/:id/engagement', async (req, res) => {
  try {
    const startTime = Date.now();
    const { action, userId } = req.body;
    
    if (!action || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Action and userId are required'
      });
    }

    const validActions = ['like', 'unlike', 'retweet', 'unretweet'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action'
      });
    }

    const engagement = await TweetModel.updateEngagement(req.params.id, action, userId);
    
    if (!engagement) {
      return res.status(404).json({
        success: false,
        error: 'Tweet not found'
      });
    }

    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: engagement,
      timestamp: new Date(),
      responseTime: `${responseTime}ms`
    });
  } catch (error) {
    console.error('Error updating engagement:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/tweets/:id/versions - Get tweet version history
router.get('/:id/versions', async (req, res) => {
  try {
    const startTime = Date.now();
    const versions = await TweetModel.getVersions(req.params.id);
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: versions,
      timestamp: new Date(),
      responseTime: `${responseTime}ms`
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/tweets/:id - Delete tweet
router.delete('/:id', async (req, res) => {
  try {
    const startTime = Date.now();
    const deleted = await TweetModel.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Tweet not found'
      });
    }

    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      data: { deleted: true },
      timestamp: new Date(),
      responseTime: `${responseTime}ms`
    });
  } catch (error) {
    console.error('Error deleting tweet:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/stats - Get system statistics
router.get('/system/stats', async (req, res) => {
  try {
    const stats = TweetModel.getStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
