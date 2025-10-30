import { describe, it, expect, beforeEach } from 'vitest';
import { MultiTierCacheService } from '../../src/services/cache/MultiTierCacheService';
import { CacheTier } from '../../src/types';

describe('MultiTierCacheService', () => {
  let cacheService: MultiTierCacheService;

  beforeEach(() => {
    cacheService = new MultiTierCacheService();
  });

  it('should store and retrieve data from L1 cache', async () => {
    const key = 'test-key';
    const value = 'test-value';
    
    await cacheService.set(key, value, CacheTier.L1);
    const result = await cacheService.get(key);
    
    expect(result).toBe(value);
  });

  it('should promote frequently accessed items to higher tiers', async () => {
    const key = 'test-promote';
    const value = 'test-value';
    
    // Set in L3
    await cacheService.set(key, value, CacheTier.L3);
    
    // Access multiple times to trigger promotion
    for (let i = 0; i < 5; i++) {
      await cacheService.get(key);
    }
    
    const stats = cacheService.getStats();
    expect(stats.tierStats.L2.hits).toBeGreaterThan(0);
  });

  it('should maintain high hit rates', async () => {
    // Populate cache with test data
    const testData = Array.from({ length: 100 }, (_, i) => ({
      key: `key-${i}`,
      value: `value-${i}`
    }));

    for (const item of testData) {
      await cacheService.set(item.key, item.value);
    }

    // Test retrieval
    let hits = 0;
    for (const item of testData) {
      const result = await cacheService.get(item.key);
      if (result === item.value) hits++;
    }

    const hitRate = (hits / testData.length) * 100;
    expect(hitRate).toBeGreaterThan(95);
  });
});
