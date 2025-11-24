/**
 * API Server with Cache Optimization
 */

import express from 'express';
import cors from 'cors';
import { CacheManager } from '../cache/CacheManager';
import { MockDatabase, Tweet } from '../database/MockDatabase';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database and cache
const database = new MockDatabase();

const cacheManager = new CacheManager<Tweet>(
  {
    l1MaxSize: 100,      // 100 items in hot cache
    l2MaxSize: 500,      // 500 items in adaptive cache
    k: 2,                // Track last 2 accesses
    ttl: 300000,         // 5 minute TTL
    workingSetWindow: 60000,  // 1 minute window
    predictionConfidence: 0.6  // 60% confidence threshold
  },
  async (key: string) => {
    const tweet = await database.query(key);
    if (!tweet) {
      throw new Error('Tweet not found');
    }
    return tweet;
  }
);

/**
 * Get tweet by ID (cached)
 */
app.get('/api/tweets/:id', async (req, res) => {
  try {
    const startTime = Date.now();
    const tweet = await cacheManager.get(req.params.id);
    const latency = Date.now() - startTime;

    res.json({
      success: true,
      data: tweet,
      latency: `${latency}ms`,
      cached: latency < 10
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Tweet not found'
    });
  }
});

/**
 * Get cache statistics
 */
app.get('/api/cache/stats', (req, res) => {
  const cacheStats = cacheManager.getStats();
  const dbStats = database.getStats();

  res.json({
    success: true,
    cache: cacheStats,
    database: dbStats,
    performance: {
      overallHitRate: calculateOverallHitRate(cacheStats),
      averageLatency: calculateAverageLatency(cacheStats, dbStats),
      improvement: calculateImprovement(cacheStats)
    }
  });
});

/**
 * Reset all statistics
 */
app.post('/api/cache/reset', (req, res) => {
  cacheManager.clear();
  database.reset();
  res.json({ success: true, message: 'Cache and stats reset' });
});

/**
 * Get top access patterns
 */
app.get('/api/patterns', (req, res) => {
  const stats = cacheManager.getStats();
  res.json({
    success: true,
    patterns: stats.predictive
  });
});

function calculateOverallHitRate(stats: any): number {
  const l1Total = stats.l1.hits + stats.l1.misses;
  const l2Total = stats.l2.hits + stats.l2.misses;
  const totalHits = stats.l1.hits + stats.l2.hits;
  const total = l1Total + l2Total;
  return total > 0 ? parseFloat(((totalHits / total) * 100).toFixed(2)) : 0;
}

function calculateAverageLatency(cacheStats: any, dbStats: any): string {
  const cacheHits = cacheStats.l1.hits + cacheStats.l2.hits;
  const cacheMisses = dbStats.totalQueries;
  const total = cacheHits + cacheMisses;
  
  if (total === 0) return '0ms';
  
  const avgLatency = (cacheHits * 2 + cacheMisses * dbStats.averageLatency) / total;
  return `${Math.round(avgLatency)}ms`;
}

function calculateImprovement(stats: any): string {
  const hitRate = parseFloat(stats.l1.hitRate);
  if (hitRate === 0) return '0%';
  
  const withoutCache = 50; // 50ms database latency
  const withCache = 2;     // 2ms cache latency
  const improvement = ((withoutCache - withCache) / withoutCache) * 100 * (hitRate / 100);
  return `${Math.round(improvement)}%`;
}

app.listen(PORT, () => {
  console.log(`🚀 Cache Optimization API running on http://localhost:${PORT}`);
  console.log(`📊 Stats available at http://localhost:${PORT}/api/cache/stats`);
});

export default app;

