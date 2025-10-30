import { describe, it, expect, beforeEach } from 'vitest';
import { MultiTierCacheService } from '../../src/services/cache/MultiTierCacheService';
import { CacheWarmingService } from '../../src/services/cache/CacheWarmingService';
import { MonitoringService } from '../../src/services/monitoring/MonitoringService';
import { TweetData } from '../../src/types';

describe('Cache System Integration', () => {
  let cacheService: MultiTierCacheService;
  let warmingService: CacheWarmingService;
  let monitoringService: MonitoringService;

  beforeEach(() => {
    cacheService = new MultiTierCacheService();
    warmingService = new CacheWarmingService(cacheService);
    monitoringService = new MonitoringService(cacheService);
  });

  it('should integrate cache warming with main cache system', async () => {
    const tweets: TweetData[] = [
      {
        id: 'viral-tweet-1',
        content: 'This is going viral! #trending',
        userId: 'user-123',
        timestamp: Date.now(),
        engagementScore: 1500,
        isViral: true
      },
      {
        id: 'normal-tweet-1',
        content: 'Regular tweet content',
        userId: 'user-456',
        timestamp: Date.now(),
        engagementScore: 50,
        isViral: false
      }
    ];

    await warmingService.warmCache(tweets);

    // Verify viral content is cached in L1
    const viralTweet = await cacheService.get('tweet:viral-tweet-1');
    expect(viralTweet).toBeTruthy();

    const stats = cacheService.getStats();
    expect(stats.tierStats.L1.entries).toBeGreaterThan(0);
  });

  it('should generate monitoring reports with performance metrics', async () => {
    // Generate some cache activity
    for (let i = 0; i < 50; i++) {
      await cacheService.set(`key-${i}`, `value-${i}`);
      await cacheService.get(`key-${i}`);
    }

    // Wait for metrics collection
    await new Promise(resolve => setTimeout(resolve, 100));

    const report = monitoringService.generateReport();
    expect(report.summary).toContain('Cache system performance');
    expect(report.performance.averageHitRate).toBeGreaterThan(0);
    expect(Array.isArray(report.recommendations)).toBe(true);
  });

  it('should maintain 99.9% hit rate under load', async () => {
    const testSize = 1000;
    const testData = Array.from({ length: testSize }, (_, i) => ({
      key: `load-test-${i}`,
      value: { id: i, data: `test-data-${i}`, timestamp: Date.now() }
    }));

    // Warm up cache
    for (const item of testData) {
      await cacheService.set(item.key, item.value);
    }

    // Simulate high load with random access patterns
    let totalRequests = 0;
    let totalHits = 0;

    for (let round = 0; round < 10; round++) {
      for (let i = 0; i < 100; i++) {
        const randomIndex = Math.floor(Math.random() * testSize);
        const key = `load-test-${randomIndex}`;
        const result = await cacheService.get(key);
        
        totalRequests++;
        if (result) totalHits++;
      }
    }

    const hitRate = (totalHits / totalRequests) * 100;
    expect(hitRate).toBeGreaterThan(99.9);
  });
});
