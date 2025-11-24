/**
 * Adaptive Replacement Cache (ARC) Implementation
 * Self-tuning cache balancing recency and frequency
 * Inspired by Redis and used by IBM for database caching
 */

interface ARCEntry<T> {
  key: string;
  value: T;
  size: number;
}

export interface ARCConfig {
  maxSize: number;
  ttl: number;
}

export class ARCCache<T> {
  private config: ARCConfig;
  
  // T1: Recent cache hits (recency)
  private t1: Map<string, ARCEntry<T>>;
  
  // T2: Frequent cache hits (frequency)
  private t2: Map<string, ARCEntry<T>>;
  
  // B1: Ghost entries evicted from T1
  private b1: Set<string>;
  
  // B2: Ghost entries evicted from T2
  private b2: Set<string>;
  
  // Target size for T1
  private p: number;
  
  private currentSize: number;
  private hits: number;
  private misses: number;
  private adaptations: number;

  constructor(config: ARCConfig) {
    this.config = config;
    this.t1 = new Map();
    this.t2 = new Map();
    this.b1 = new Set();
    this.b2 = new Set();
    this.p = 0;  // Start with balanced split
    this.currentSize = 0;
    this.hits = 0;
    this.misses = 0;
    this.adaptations = 0;
  }

  /**
   * Get item from cache
   * Moves items between T1 and T2 based on access patterns
   */
  get(key: string): T | null {
    // Check T1 (recent items)
    if (this.t1.has(key)) {
      const entry = this.t1.get(key)!;
      this.t1.delete(key);
      this.t2.set(key, entry);  // Promote to frequent
      this.hits++;
      return entry.value;
    }

    // Check T2 (frequent items)
    if (this.t2.has(key)) {
      this.hits++;
      return this.t2.get(key)!.value;
    }

    this.misses++;
    return null;
  }

  /**
   * Set item in cache
   * Adapts the split between recency and frequency based on workload
   */
  set(key: string, value: T, size: number = 1): void {
    const entry: ARCEntry<T> = { key, value, size };

    // Case 1: In T1 or T2, just update
    if (this.t1.has(key)) {
      this.currentSize -= this.t1.get(key)!.size;
      this.t1.set(key, entry);
      this.currentSize += size;
      return;
    }

    if (this.t2.has(key)) {
      this.currentSize -= this.t2.get(key)!.size;
      this.t2.set(key, entry);
      this.currentSize += size;
      return;
    }

    // Case 2: In B1 (was in T1, got evicted)
    // This means recency-based eviction was wrong, grow T1
    if (this.b1.has(key)) {
      this.adaptUp();
      this.b1.delete(key);
    }

    // Case 3: In B2 (was in T2, got evicted)
    // This means frequency-based eviction was wrong, shrink T1 (grow T2)
    if (this.b2.has(key)) {
      this.adaptDown();
      this.b2.delete(key);
    }

    // Evict if necessary
    while (this.currentSize + size > this.config.maxSize) {
      this.evict();
    }

    // Insert into T1 (recent)
    this.t1.set(key, entry);
    this.currentSize += size;
  }

  /**
   * Adapt target size upward (favor recency)
   */
  private adaptUp(): void {
    const delta = this.b1.size >= this.b2.size ? 1 : this.b2.size / this.b1.size;
    this.p = Math.min(this.p + delta, this.config.maxSize);
    this.adaptations++;
  }

  /**
   * Adapt target size downward (favor frequency)
   */
  private adaptDown(): void {
    const delta = this.b2.size >= this.b1.size ? 1 : this.b1.size / this.b2.size;
    this.p = Math.max(this.p - delta, 0);
    this.adaptations++;
  }

  /**
   * Evict based on current target size p
   */
  private evict(): void {
    const t1Size = Array.from(this.t1.values()).reduce((sum, e) => sum + e.size, 0);
    
    if (t1Size > this.p && this.t1.size > 0) {
      // Evict from T1 to B1
      const key = this.t1.keys().next().value;
      if (key !== undefined) {
        const entry = this.t1.get(key)!;
        this.t1.delete(key);
        this.b1.add(key);
        this.currentSize -= entry.size;
        
        // Limit B1 size
        if (this.b1.size > this.config.maxSize) {
          const oldestKey = this.b1.values().next().value;
          if (oldestKey !== undefined) {
            this.b1.delete(oldestKey);
          }
        }
      }
    } else if (this.t2.size > 0) {
      // Evict from T2 to B2
      const key = this.t2.keys().next().value;
      if (key !== undefined) {
        const entry = this.t2.get(key)!;
        this.t2.delete(key);
        this.b2.add(key);
        this.currentSize -= entry.size;
        
        // Limit B2 size
        if (this.b2.size > this.config.maxSize) {
          const oldestKey = this.b2.values().next().value;
          if (oldestKey !== undefined) {
            this.b2.delete(oldestKey);
          }
        }
      }
    }
  }

  /**
   * Get cache statistics including adaptation metrics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      t1Size: this.t1.size,
      t2Size: this.t2.size,
      b1Size: this.b1.size,
      b2Size: this.b2.size,
      targetP: this.p,
      currentSize: this.currentSize,
      maxSize: this.config.maxSize,
      utilization: (this.currentSize / this.config.maxSize) * 100,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
      adaptations: this.adaptations,
      recencyBias: this.p / this.config.maxSize
    };
  }

  clear(): void {
    this.t1.clear();
    this.t2.clear();
    this.b1.clear();
    this.b2.clear();
    this.p = 0;
    this.currentSize = 0;
    this.hits = 0;
    this.misses = 0;
    this.adaptations = 0;
  }
}

