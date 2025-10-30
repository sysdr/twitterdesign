export interface CacheEntry {
  key: string;
  value: any;
  tier: CacheTier;
  ttl: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export enum CacheTier {
  L1 = 'L1',
  L2 = 'L2', 
  L3 = 'L3'
}

export interface CacheStats {
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalHits: number;
  totalMisses: number;
  tierStats: Record<CacheTier, {
    hits: number;
    misses: number;
    entries: number;
    memoryUsage: number;
  }>;
  bloomFilterStats: {
    falsePositiveRate: number;
    memoryUsage: number;
    totalChecks: number;
  };
}

export interface TweetData {
  id: string;
  content: string;
  userId: string;
  timestamp: number;
  engagementScore: number;
  isViral: boolean;
}

export interface WarmingPrediction {
  tweetId: string;
  viralProbability: number;
  recommendedTier: CacheTier;
  priority: number;
}
