import express from 'express';
import { versionMiddleware, deprecationWarning } from '../middleware/versioning';

// Import version-specific routes
import tweetsV1 from './v1/tweets';
import tweetsV2 from './v2/tweets';

const router = express.Router();

// Apply versioning middleware to all routes
router.use(versionMiddleware as any);

// Apply deprecation warnings
router.use(deprecationWarning('1', 'v2', 'v3'));

// V1 Routes
router.use('/v1/tweets', tweetsV1);

// V2 Routes  
router.use('/v2/tweets', tweetsV2);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API info endpoint
router.get('/info', (req, res) => {
  res.json({
    name: 'Twitter API Clone',
    description: 'Production-ready API with rate limiting and versioning',
    versions: ['v1', 'v2'],
    features: {
      v1: ['basic_tweets', 'basic_users'],
      v2: ['basic_tweets', 'basic_users', 'reactions', 'threads', 'polls']
    },
    documentation: '/docs',
    rateLimits: {
      basic: '100 requests per 15 minutes',
      premium: '300 requests per 15 minutes', 
      verified: '1000 requests per 15 minutes'
    }
  });
});

// Dashboard endpoint with real-time metrics
router.get('/dashboard', async (req, res) => {
  try {
    // Get current tweet counts from both versions
    const v1Response = await fetch('http://localhost:3000/api/v1/tweets');
    const v2Response = await fetch('http://localhost:3000/api/v2/tweets');
    
    const v1Data = await v1Response.json() as any;
    const v2Data = await v2Response.json() as any;
    
    // Calculate total engagement metrics
    const totalLikes = (v1Data.data || []).reduce((sum: number, tweet: any) => sum + (tweet.likes || 0), 0) + 
                      (v2Data.data || []).reduce((sum: number, tweet: any) => sum + (tweet.likes || 0), 0);
    const totalRetweets = (v1Data.data || []).reduce((sum: number, tweet: any) => sum + (tweet.retweets || 0), 0) + 
                         (v2Data.data || []).reduce((sum: number, tweet: any) => sum + (tweet.retweets || 0), 0);
    const totalReplies = (v1Data.data || []).reduce((sum: number, tweet: any) => sum + (tweet.replies || 0), 0) + 
                        (v2Data.data || []).reduce((sum: number, tweet: any) => sum + (tweet.replies || 0), 0);
    
    // Get Redis info for system metrics
    const { redis } = require('../utils/redis');
    const redisInfo = await redis.info();
    const connectedClients = redisInfo.match(/connected_clients:(\d+)/)?.[1] || '0';
    
    res.json({
      timestamp: new Date().toISOString(),
      metrics: {
        tweets: {
          v1: {
            count: (v1Data.data || []).length,
            total: v1Data.meta?.total || 0
          },
          v2: {
            count: (v2Data.data || []).length,
            total: v2Data.meta?.total || 0
          },
          total: (v1Data.meta?.total || 0) + (v2Data.meta?.total || 0)
        },
        engagement: {
          totalLikes,
          totalRetweets,
          totalReplies,
          totalEngagement: totalLikes + totalRetweets + totalReplies
        },
        rateLimiting: {
          v1Remaining: v1Data.meta?.rateLimitInfo?.remaining || 0,
          v1Limit: v1Data.meta?.rateLimitInfo?.limit || 100,
          v2Remaining: v2Data.meta?.rateLimitInfo?.remaining || 0,
          v2Limit: v2Data.meta?.rateLimitInfo?.limit || 100
        },
        system: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          redisClients: parseInt(connectedClients),
          nodeVersion: process.version
        }
      },
      status: 'operational'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch dashboard metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
