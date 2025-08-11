import { CacheManager } from '../../src/cache/CacheManager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(async () => {
    cacheManager = new CacheManager({
      redis: { host: 'localhost', port: 6379, maxRetriesPerRequest: 1 }
    });
    await cacheManager.initialize();
  });

  afterEach(async () => {
    await cacheManager.shutdown();
  });

  test('should set and get values from cache', async () => {
    const key = 'test-key';
    const value = { message: 'Hello, World!' };

    await cacheManager.set(key, value);
    const retrieved = await cacheManager.get(key);

    expect(retrieved).toEqual(value);
  });

  test('should return null for non-existent keys', async () => {
    const result = await cacheManager.get('non-existent-key');
    expect(result).toBeNull();
  });

  test('should invalidate cache entries by pattern', async () => {
    await cacheManager.set('user:1:timeline', { tweets: [] });
    await cacheManager.set('user:2:timeline', { tweets: [] });
    await cacheManager.set('trending:global', { topics: [] });

    await cacheManager.invalidate('timeline');

    expect(await cacheManager.get('user:1:timeline')).toBeNull();
    expect(await cacheManager.get('user:2:timeline')).toBeNull();
    expect(await cacheManager.get('trending:global')).not.toBeNull();
  });

  test('should track hit rate correctly', async () => {
    await cacheManager.set('test', { data: 'value' });
    
    // Hit
    await cacheManager.get('test');
    // Miss
    await cacheManager.get('missing');

    const hitRate = await cacheManager.getHitRate();
    expect(hitRate).toBe(0.5);
  });
});
