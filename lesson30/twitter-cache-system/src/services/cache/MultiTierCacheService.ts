import { CacheEntry, CacheTier, CacheStats } from '../../types';
import { BloomFilterService } from '../bloom/BloomFilterService';

export class MultiTierCacheService {
  private l1Cache = new Map<string, CacheEntry>(); // Hot - 100ms TTL
  private l2Cache = new Map<string, CacheEntry>(); // Warm - 1hr TTL  
  private l3Cache = new Map<string, CacheEntry>(); // Cold - 24hr TTL
  private bloomFilter: BloomFilterService;
  private stats!: CacheStats;

  constructor() {
    this.bloomFilter = new BloomFilterService();
    this.initializeStats();
    this.startTTLCleanup();
  }

  async get(key: string): Promise<any> {
    
    // Check L1 first (hot data)
    if (this.bloomFilter.checkL1(key)) {
      const entry = this.l1Cache.get(key);
      if (entry && !this.isExpired(entry)) {
        this.recordHit(CacheTier.L1);
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        return entry.value;
      } else if (entry) {
        this.l1Cache.delete(key);
        this.bloomFilter.recordFalsePositive();
      }
    }

    // Check L2 (warm data)
    if (this.bloomFilter.checkL2(key)) {
      const entry = this.l2Cache.get(key);
      if (entry && !this.isExpired(entry)) {
        this.recordHit(CacheTier.L2);
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        // Promote to L1 if frequently accessed
        if (entry.accessCount > 10) {
          await this.promoteToL1(key, entry.value);
        }
        return entry.value;
      } else if (entry) {
        this.l2Cache.delete(key);
        this.bloomFilter.recordFalsePositive();
      }
    }

    // Check L3 (cold data)
    if (this.bloomFilter.checkL3(key)) {
      const entry = this.l3Cache.get(key);
      if (entry && !this.isExpired(entry)) {
        this.recordHit(CacheTier.L3);
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        // Promote to L2 if accessed
        if (entry.accessCount > 3) {
          await this.promoteToL2(key, entry.value);
        }
        return entry.value;
      } else if (entry) {
        this.l3Cache.delete(key);
        this.bloomFilter.recordFalsePositive();
      }
    }

    this.recordMiss();
    return null;
  }

  async set(key: string, value: any, tier: CacheTier = CacheTier.L1): Promise<void> {
    const entry: CacheEntry = {
      key,
      value,
      tier,
      ttl: this.getTTLForTier(tier),
      createdAt: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    };

    switch (tier) {
      case CacheTier.L1:
        this.l1Cache.set(key, entry);
        this.bloomFilter.addToL1(key);
        break;
      case CacheTier.L2:
        this.l2Cache.set(key, entry);
        this.bloomFilter.addToL2(key);
        break;
      case CacheTier.L3:
        this.l3Cache.set(key, entry);
        this.bloomFilter.addToL3(key);
        break;
    }

    this.updateStats();
  }

  private async promoteToL1(key: string, value: any): Promise<void> {
    await this.set(key, value, CacheTier.L1);
  }

  private async promoteToL2(key: string, value: any): Promise<void> {
    await this.set(key, value, CacheTier.L2);
  }

  private getTTLForTier(tier: CacheTier): number {
    switch (tier) {
      case CacheTier.L1: return 100; // 100ms for viral/trending content
      case CacheTier.L2: return 3600000; // 1 hour for recent content
      case CacheTier.L3: return 86400000; // 24 hours for historical content
    }
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.createdAt > entry.ttl;
  }

  private recordHit(tier: CacheTier): void {
    this.stats.totalHits++;
    this.stats.totalRequests++;
    this.stats.tierStats[tier].hits++;
    this.updateHitRate();
  }

  private recordMiss(): void {
    this.stats.totalMisses++;
    this.stats.totalRequests++;
    Object.values(this.stats.tierStats).forEach(tierStat => tierStat.misses++);
    this.updateHitRate();
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.totalHits / this.stats.totalRequests) * 100 
      : 0;
    this.stats.missRate = 100 - this.stats.hitRate;
  }

  private initializeStats(): void {
    this.stats = {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      totalHits: 0,
      totalMisses: 0,
      tierStats: {
        [CacheTier.L1]: { hits: 0, misses: 0, entries: 0, memoryUsage: 0 },
        [CacheTier.L2]: { hits: 0, misses: 0, entries: 0, memoryUsage: 0 },
        [CacheTier.L3]: { hits: 0, misses: 0, entries: 0, memoryUsage: 0 }
      },
      bloomFilterStats: {
        falsePositiveRate: 0,
        memoryUsage: 0,
        totalChecks: 0
      }
    };
  }

  private updateStats(): void {
    this.stats.tierStats[CacheTier.L1].entries = this.l1Cache.size;
    this.stats.tierStats[CacheTier.L2].entries = this.l2Cache.size;
    this.stats.tierStats[CacheTier.L3].entries = this.l3Cache.size;
    this.stats.bloomFilterStats = this.bloomFilter.getStats();
  }

  private startTTLCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 10000); // Cleanup every 10 seconds
  }

  private cleanupExpiredEntries(): void {
    [this.l1Cache, this.l2Cache, this.l3Cache].forEach(cache => {
      for (const [key, entry] of cache.entries()) {
        if (this.isExpired(entry)) {
          cache.delete(key);
        }
      }
    });
    this.updateStats();
  }

  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
    this.l3Cache.clear();
    this.bloomFilter.reset();
    this.initializeStats();
  }
}
