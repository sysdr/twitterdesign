import { TokenBucket, UserTier } from '../types';

export class RateLimitingService {
  private buckets = new Map<string, TokenBucket>();
  
  private readonly TIER_CONFIGS = {
    [UserTier.REGULAR]: { capacity: 10, refillRate: 1 },
    [UserTier.POPULAR]: { capacity: 50, refillRate: 5 },
    [UserTier.CELEBRITY]: { capacity: 100, refillRate: 10 }
  };

  createBucket(userId: string, tier: UserTier): TokenBucket {
    const config = this.TIER_CONFIGS[tier];
    const bucket: TokenBucket = {
      tokens: config.capacity,
      capacity: config.capacity,
      refillRate: config.refillRate,
      lastRefill: new Date()
    };
    
    this.buckets.set(userId, bucket);
    return bucket;
  }

  consumeTokens(userId: string, tier: UserTier, tokensRequested: number = 1): boolean {
    let bucket = this.buckets.get(userId);
    
    if (!bucket) {
      bucket = this.createBucket(userId, tier);
    }
    
    this.refillBucket(bucket);
    
    if (bucket.tokens >= tokensRequested) {
      bucket.tokens -= tokensRequested;
      return true;
    }
    
    return false;
  }

  private refillBucket(bucket: TokenBucket): void {
    const now = new Date();
    const timePassed = (now.getTime() - bucket.lastRefill.getTime()) / 1000;
    const tokensToAdd = Math.floor(timePassed * bucket.refillRate);
    
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  getBucketStatus(userId: string): TokenBucket | null {
    return this.buckets.get(userId) || null;
  }
}
