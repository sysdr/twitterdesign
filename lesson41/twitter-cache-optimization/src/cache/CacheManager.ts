/**
 * Unified Cache Manager
 * Coordinates L1 (LRU-K), L2 (ARC), working set analysis, and predictive warming
 */

import { LRUKCache } from './lru-k/LRUKCache';
import { ARCCache } from './arc/ARCCache';
import { WorkingSetAnalyzer } from '../algorithms/WorkingSetAnalyzer';
import { PredictiveWarmer } from './predictive/PredictiveWarmer';

export interface CacheManagerConfig {
  l1MaxSize: number;
  l2MaxSize: number;
  k: number;
  ttl: number;
  workingSetWindow: number;
  predictionConfidence: number;
}

export class CacheManager<T> {
  private l1Cache: LRUKCache<T>;  // In-memory hot cache
  private l2Cache: ARCCache<T>;   // Larger adaptive cache
  private workingSet: WorkingSetAnalyzer;
  private warmer: PredictiveWarmer;
  private dataFetcher: (key: string) => Promise<T>;

  constructor(
    config: CacheManagerConfig,
    dataFetcher: (key: string) => Promise<T>
  ) {
    this.l1Cache = new LRUKCache<T>({
      maxSize: config.l1MaxSize,
      k: config.k,
      ttl: config.ttl
    });

    this.l2Cache = new ARCCache<T>({
      maxSize: config.l2MaxSize,
      ttl: config.ttl
    });

    this.workingSet = new WorkingSetAnalyzer({
      windowSize: config.workingSetWindow,
      sampleInterval: 1000
    });

    this.warmer = new PredictiveWarmer({
      minConfidence: config.predictionConfidence,
      maxPredictions: 5,
      learningWindow: 300000  // 5 minutes
    });

    this.dataFetcher = dataFetcher;
  }

  /**
   * Get data with multi-tier caching
   */
  async get(key: string): Promise<T> {
    // Record access for working set and pattern learning
    this.workingSet.recordAccess(key);
    this.warmer.learn(key);

    // Try L1 (hot cache)
    let data = this.l1Cache.get(key);
    if (data !== null) {
      await this.predictiveWarm(key);
      return data;
    }

    // Try L2 (larger cache)
    data = this.l2Cache.get(key);
    if (data !== null) {
      // Promote to L1 if hot enough
      this.l1Cache.set(key, data, 1);
      await this.predictiveWarm(key);
      return data;
    }

    // Cache miss - fetch from source
    data = await this.dataFetcher(key);
    
    // Store in both caches
    this.l2Cache.set(key, data, 1);
    this.l1Cache.set(key, data, 1);

    await this.predictiveWarm(key);
    return data;
  }

  /**
   * Predictive warming based on access patterns
   */
  private async predictiveWarm(key: string): Promise<void> {
    const predictions = this.warmer.predict(key);
    
    for (const predictedKey of predictions) {
      // Warm asynchronously without blocking
      this.warmKey(predictedKey).catch(() => {
        // Ignore warming errors
      });
    }
  }

  /**
   * Warm a specific key into cache
   */
  private async warmKey(key: string): Promise<void> {
    // Check if already cached
    if (this.l1Cache.has(key) || this.l2Cache.get(key) !== null) {
      this.warmer.recordCorrectPrediction();
      return;
    }

    // Fetch and cache
    try {
      const data = await this.dataFetcher(key);
      this.l2Cache.set(key, data, 1);
      this.warmer.recordCorrectPrediction();
    } catch (error) {
      // Warming failed, skip
    }
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      l1: this.l1Cache.getStats(),
      l2: this.l2Cache.getStats(),
      workingSet: this.workingSet.getStats(),
      predictive: this.warmer.getStats(),
      recommendation: {
        optimalL1Size: Math.ceil(this.workingSet.getStats().recommendedCacheSize * 0.2),
        optimalL2Size: this.workingSet.getStats().recommendedCacheSize
      }
    };
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
    this.warmer.clear();
  }
}

