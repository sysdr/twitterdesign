import { EdgeCacheService } from '../../src/services/edge/EdgeCacheService';

describe('EdgeCacheService', () => {
  let cacheService: EdgeCacheService;

  beforeEach(() => {
    cacheService = new EdgeCacheService('test-region');
  });

  afterEach(async () => {
    // Cleanup
  });

  test('should cache and retrieve content', async () => {
    const testData = { message: 'test content' };
    const key = 'test:key';
    
    await cacheService.set(key, testData, 300);
    const retrieved = await cacheService.get(key);
    
    expect(retrieved).toBeTruthy();
    expect(retrieved?.content).toEqual(testData);
  });

  test('should return null for expired content', async () => {
    const testData = { message: 'test content' };
    const key = 'test:expired';
    
    await cacheService.set(key, testData, -1); // Expired
    const retrieved = await cacheService.get(key);
    
    expect(retrieved).toBeNull();
  });

  test('should update hit rate statistics', async () => {
    const testData = { message: 'test content' };
    const key = 'test:stats';
    
    await cacheService.set(key, testData, 300);
    await cacheService.get(key); // Hit
    await cacheService.get('nonexistent'); // Miss
    
    const stats = cacheService.getStats();
    expect(stats.totalRequests).toBe(2);
    expect(stats.totalHits).toBe(1);
    expect(stats.hitRate).toBe(50);
  });
});
