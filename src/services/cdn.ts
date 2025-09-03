import { CDNCache } from '../types';

export class CDNService {
  private cache: Map<string, CDNCache> = new Map();
  private hitRates: Map<string, number> = new Map();

  constructor() {
    this.startCacheCleanup();
  }

  async get(key: string, region: string): Promise<any> {
    const cacheKey = `${region}:${key}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      cached.hitCount++;
      this.updateHitRate(region);
      return cached.content;
    }
    
    return null;
  }

  async set(key: string, content: any, region: string, ttlSeconds: number = 300): Promise<void> {
    const cacheKey = `${region}:${key}`;
    this.cache.set(cacheKey, {
      key,
      content,
      region,
      hitCount: 0,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }

  async invalidate(key: string, regions?: string[]): Promise<void> {
    if (regions) {
      regions.forEach(region => {
        this.cache.delete(`${region}:${key}`);
      });
    } else {
      // Invalidate across all regions
      const keysToDelete = Array.from(this.cache.keys()).filter(k => k.endsWith(`:${key}`));
      keysToDelete.forEach(k => this.cache.delete(k));
    }
  }

  getCacheStats(): { [region: string]: { size: number; hitRate: number } } {
    const stats: { [region: string]: { size: number; hitRate: number } } = {};
    
    for (const [key, cached] of this.cache) {
      const [region] = key.split(':');
      if (!stats[region]) {
        stats[region] = { size: 0, hitRate: 0 };
      }
      stats[region].size++;
    }

    for (const [region, hitRate] of this.hitRates) {
      if (stats[region]) {
        stats[region].hitRate = hitRate;
      }
    }

    return stats;
  }

  private updateHitRate(region: string): void {
    const current = this.hitRates.get(region) || 0;
    this.hitRates.set(region, current + 1);
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.cache) {
        if (cached.expiresAt <= now) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }
}
