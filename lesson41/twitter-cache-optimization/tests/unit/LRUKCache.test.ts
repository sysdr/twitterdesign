import { LRUKCache } from '../../src/cache/lru-k/LRUKCache';

describe('LRUKCache', () => {
  let cache: LRUKCache<string>;

  beforeEach(() => {
    cache = new LRUKCache<string>({
      maxSize: 5,
      k: 2,
      ttl: 60000
    });
  });

  test('should store and retrieve items', () => {
    cache.set('key1', 'value1', 1);
    expect(cache.get('key1')).toBe('value1');
  });

  test('should return null for missing keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  test('should evict based on LRU-K algorithm', () => {
    // Fill cache
    cache.set('key1', 'value1', 1);
    cache.set('key2', 'value2', 1);
    cache.set('key3', 'value3', 1);
    cache.set('key4', 'value4', 1);
    cache.set('key5', 'value5', 1);

    // Access key1 twice (K=2)
    cache.get('key1');
    cache.get('key1');

    // Access key2 once
    cache.get('key2');

    // Add new item, should evict key3 (never accessed)
    cache.set('key6', 'value6', 1);

    expect(cache.get('key1')).toBe('value1'); // Kept (K accesses)
    expect(cache.get('key2')).toBe('value2'); // Kept (accessed)
    expect(cache.get('key3')).toBeNull();     // Evicted
  });

  test('should track hit rate correctly', () => {
    cache.set('key1', 'value1', 1);
    
    cache.get('key1'); // Hit
    cache.get('key2'); // Miss
    cache.get('key1'); // Hit

    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(66.67, 1);
  });
});

