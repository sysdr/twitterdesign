/**
 * LRU-K Cache Implementation
 * Tracks last K accesses to distinguish between hot and cold data
 * Used by Instagram and Twitter for timeline caching
 */

export interface CacheItem<T> {
  key: string;
  value: T;
  accessHistory: number[];  // Last K access timestamps
  createdAt: number;
  size: number;
}

export interface LRUKConfig {
  maxSize: number;
  k: number;  // Number of historical accesses to track
  ttl: number;  // Time to live in milliseconds
}

export class LRUKCache<T> {
  private cache: Map<string, CacheItem<T>>;
  private config: LRUKConfig;
  private currentSize: number;
  private hits: number;
  private misses: number;
  private evictions: number;

  constructor(config: LRUKConfig) {
    this.cache = new Map();
    this.config = config;
    this.currentSize = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Get item from cache
   * Records access in history for LRU-K algorithm
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - item.createdAt > this.config.ttl) {
      this.cache.delete(key);
      this.currentSize -= item.size;
      this.misses++;
      return null;
    }

    // Update access history (keep last K accesses)
    item.accessHistory.push(Date.now());
    if (item.accessHistory.length > this.config.k) {
      item.accessHistory.shift();
    }

    this.hits++;
    return item.value;
  }

  /**
   * Set item in cache
   * Evicts based on LRU-K algorithm if cache is full
   */
  set(key: string, value: T, size: number = 1): void {
    // If key exists, update it
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentSize -= existing.size;
    }

    // Evict if necessary
    while (this.currentSize + size > this.config.maxSize) {
      this.evictOne();
    }

    const item: CacheItem<T> = {
      key,
      value,
      accessHistory: [Date.now()],
      createdAt: Date.now(),
      size
    };

    this.cache.set(key, item);
    this.currentSize += size;
  }

  /**
   * LRU-K Eviction Algorithm
   * Evicts item with oldest K-th access (or oldest single access for items with <K accesses)
   */
  private evictOne(): void {
    let victimKey: string | null = null;
    let oldestKthAccess = Infinity;

    for (const [key, item] of this.cache.entries()) {
      // For items with K accesses, look at the K-th access time
      const kthAccessTime = item.accessHistory.length >= this.config.k
        ? item.accessHistory[0]  // Oldest of the K accesses
        : item.accessHistory[0];  // Only access if <K

      if (kthAccessTime < oldestKthAccess) {
        oldestKthAccess = kthAccessTime;
        victimKey = key;
      }
    }

    if (victimKey) {
      const victim = this.cache.get(victimKey)!;
      this.currentSize -= victim.size;
      this.cache.delete(victimKey);
      this.evictions++;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.config.maxSize,
      utilization: (this.currentSize / this.config.maxSize) * 100,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
      evictions: this.evictions
    };
  }

  /**
   * Clear all cache data
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Get number of items in cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
}

