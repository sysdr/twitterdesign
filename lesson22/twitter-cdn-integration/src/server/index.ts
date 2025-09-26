import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import WebSocket from 'ws';
import path from 'path';

import { EdgeCacheService } from '../services/edge/EdgeCacheService';
import { InvalidationService } from '../services/invalidation/InvalidationService';
import { CDNMonitoringService } from '../services/monitoring/CDNMonitoringService';

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Edge locations
const EDGE_LOCATIONS = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];

// Initialize services
const edgeCaches = new Map<string, EdgeCacheService>();
EDGE_LOCATIONS.forEach(location => {
  edgeCaches.set(location, new EdgeCacheService(location));
});

const invalidationService = new InvalidationService(EDGE_LOCATIONS);
const monitoringService = new CDNMonitoringService(EDGE_LOCATIONS);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// CDN API routes
app.get('/api/cdn/metrics', async (_req, res) => {
  try {
    // Always generate metrics from edge cache stats
    const edgeMetrics = [];
    let totalRequests = 0;
    let totalHits = 0;
    let totalBandwidth = 0;
    
    for (const [location, edgeCache] of edgeCaches) {
      const stats = edgeCache.getStats();
      console.log(`Edge ${location} stats:`, stats);
      edgeMetrics.push({
        edgeLocation: location,
        hitRate: stats.hitRate,
        totalRequests: stats.totalRequests,
        avgResponseTime: stats.avgResponseTime,
        bandwidthUsage: stats.totalRequests * 1024, // Simulate bandwidth
        errorRate: 0,
        timestamp: Date.now(),
      });
      
      totalRequests += stats.totalRequests;
      totalHits += stats.totalHits;
      totalBandwidth += stats.totalRequests * 1024;
    }
    
    const metrics = {
      totalHitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
      totalRequests,
      totalBandwidth,
      edgeMetrics,
      lastUpdated: Date.now(),
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

app.get('/api/cdn/analytics', async (req, res) => {
  try {
    const range = req.query.range as string || '24h';
    const hours = range === '1h' ? 1 : range === '6h' ? 6 : 24;
    
    const history = await monitoringService.getMetricsHistory(hours);
    const invalidationStats = await invalidationService.getInvalidationStats();
    
    const analytics = {
      hitRateHistory: history.map(h => ({
        timestamp: h.lastUpdated,
        hitRate: h.totalHitRate
      })),
      topCachedContent: [
        { key: 'timeline:user:123', hits: 1250, size: 45000 },
        { key: 'profile:user:456', hits: 890, size: 12000 },
        { key: 'trending:hashtags', hits: 750, size: 8500 },
      ],
      invalidationEvents: Object.entries(invalidationStats).map(([type, count]) => ({
        type,
        count: parseInt(count.toString())
      }))
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Content API with CDN integration
app.get('/api/content/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  const cacheKey = `${type}:${id}`;
  
  // Get user's nearest edge location (simplified)
  const edgeLocation = getEdgeLocation(req.headers['x-forwarded-for'] as string);
  const edgeCache = edgeCaches.get(edgeLocation);
  
  if (!edgeCache) {
    return res.status(500).json({ error: 'Edge cache not available' });
  }
  
  try {
    // Try to get from cache first
    let cached = await edgeCache.get(cacheKey);
    
    if (cached) {
      res.set('X-Cache', 'HIT');
      res.set('X-Edge-Location', edgeLocation);
      res.set('ETag', cached.etag);
      return res.json(cached.content);
    }
    
    // Cache miss - generate content (simulate origin)
    const content = generateContent(type, id);
    
    // Cache the content
    const ttl = getTTL(type);
    await edgeCache.set(cacheKey, content, ttl, 'application/json');
    
    res.set('X-Cache', 'MISS');
    res.set('X-Edge-Location', edgeLocation);
    res.json(content);
    
  } catch (error) {
    console.error('Content fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Cache invalidation endpoint
app.post('/api/cdn/invalidate', async (req, res) => {
  const { type, id, userId } = req.body;
  
  try {
    if (userId) {
      await invalidationService.invalidateUserContent(userId);
    } else if (type && id) {
      await invalidationService.invalidateContent(id, type);
    } else {
      return res.status(400).json({ error: 'Invalid invalidation request' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Invalidation error:', error);
    res.status(500).json({ error: 'Failed to invalidate cache' });
  }
});

// WebSocket for real-time metrics
wss.on('connection', (ws) => {
  const metricsListener = (metrics: any) => {
    ws.send(JSON.stringify({ type: 'metrics', data: metrics }));
  };
  
  monitoringService.on('metrics', metricsListener);
  
  ws.on('close', () => {
    monitoringService.off('metrics', metricsListener);
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../../dist')));

// Fallback for SPA
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

function getEdgeLocation(_ip: string): string {
  // Simplified edge location selection
  // In production, this would use actual geolocation
  const locations = ['us-east-1', 'eu-west-1', 'ap-southeast-1'];
  return locations[Math.floor(Math.random() * locations.length)];
}

function generateContent(type: string, id: string): any {
  // Simulate content generation
  switch (type) {
    case 'tweet':
      return {
        id,
        text: `Sample tweet content ${id}`,
        user: `user_${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        likes: Math.floor(Math.random() * 100),
        retweets: Math.floor(Math.random() * 50)
      };
    case 'profile':
      return {
        id,
        username: `user_${id}`,
        displayName: `User ${id}`,
        bio: `Bio for user ${id}`,
        followers: Math.floor(Math.random() * 10000),
        following: Math.floor(Math.random() * 1000)
      };
    case 'timeline':
      return {
        id,
        tweets: Array.from({ length: 20 }, (_, i) => ({
          id: `tweet_${id}_${i}`,
          text: `Timeline tweet ${i} for ${id}`,
          timestamp: Date.now() - (i * 60000)
        }))
      };
    default:
      return { id, type, data: `Content for ${type}:${id}` };
  }
}

function getTTL(type: string): number {
  // Different TTL strategies for different content types
  switch (type) {
    case 'tweet': return 300; // 5 minutes
    case 'profile': return 600; // 10 minutes
    case 'timeline': return 30; // 30 seconds
    case 'trending': return 120; // 2 minutes
    default: return 300;
  }
}

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 CDN server running on port ${PORT}`);
  console.log(`📍 Edge locations: ${EDGE_LOCATIONS.join(', ')}`);
});
