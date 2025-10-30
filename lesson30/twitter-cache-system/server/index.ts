import express from 'express';
import { MultiTierCacheService } from '../src/services/cache/MultiTierCacheService.ts';
import { CacheWarmingService } from '../src/services/cache/CacheWarmingService.ts';
import { MonitoringService } from '../src/services/monitoring/MonitoringService.ts';

const app = express();
const PORT = 8080;

// Initialize services
const cacheService = new MultiTierCacheService();
const warmingService = new CacheWarmingService(cacheService);
const monitoringService = new MonitoringService(cacheService);

app.use(express.json());

// Serve static files
app.use(express.static('dist'));

// Cache stats endpoint
app.get('/api/cache/stats', (req, res) => {
  const stats = monitoringService.getCurrentStats();
  res.json(stats);
});

// Cache test endpoint
app.post('/api/cache/test', async (req, res) => {
  console.log('🧪 Starting cache performance test...');
  
  const testData = Array.from({ length: 1000 }, (_, i) => ({
    key: `test-key-${i}`,
    value: `test-value-${i}-${Date.now()}`,
    type: Math.random() > 0.7 ? 'viral' : Math.random() > 0.4 ? 'trending' : 'normal'
  }));

  let hits = 0;
  let misses = 0;

  // Set test data
  for (const item of testData) {
    const tier = item.type === 'viral' ? 'L1' : item.type === 'trending' ? 'L2' : 'L3';
    await cacheService.set(item.key, item.value, tier);
  }

  // Test retrievals
  for (const item of testData) {
    const result = await cacheService.get(item.key);
    if (result) hits++;
    else misses++;
  }

  console.log(`✅ Test completed: ${hits} hits, ${misses} misses`);
  res.json({ 
    success: true, 
    results: { hits, misses, hitRate: (hits / (hits + misses)) * 100 }
  });
});

// Cache warming endpoint
app.post('/api/cache/warm', async (req, res) => {
  console.log('🔥 Starting cache warming...');
  
  const trendingTweets = Array.from({ length: 100 }, (_, i) => ({
    id: `warm-tweet-${Date.now()}-${i}`,
    content: `Warming tweet #${i} with hashtags #trending #cache`,
    userId: `user-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now() - Math.random() * 3600000,
    engagementScore: Math.floor(Math.random() * 1000),
    isViral: Math.random() > 0.85
  }));

  await warmingService.warmCache(trendingTweets);
  
  console.log('✅ Cache warming completed');
  res.json({ success: true, warmed: trendingTweets.length });
});

// Monitoring report endpoint
app.get('/api/monitoring/report', (req, res) => {
  const report = monitoringService.generateReport();
  res.json(report);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Seed some initial activity to avoid zero metrics on fresh start
(async () => {
  const trendingTweets = Array.from({ length: 20 }, (_, i) => ({
    id: `init-tweet-${Date.now()}-${i}`,
    content: `Initial warm tweet #${i}`,
    userId: `user-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now() - Math.random() * 3600000,
    engagementScore: Math.floor(Math.random() * 1000),
    isViral: Math.random() > 0.85
  }));
  try {
    await warmingService.warmCache(trendingTweets);
  } catch (e) {
    console.warn('Warm-up failed:', e);
  }
})();

app.listen(PORT, () => {
  console.log(`🚀 Advanced Cache System Server running on http://localhost:${PORT}`);
  console.log('📊 Dashboard available at http://localhost:3000');
});
