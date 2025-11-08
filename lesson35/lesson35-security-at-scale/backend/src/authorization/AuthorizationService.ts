import Redis from 'ioredis';

export interface Permission {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
}

export interface RelationshipCheck {
  userId: string;
  targetUserId: string;
  relationship: 'follower' | 'following' | 'blocked' | 'muted';
}

export class AuthorizationService {
  private redis: Redis;
  private relationshipGraph: Map<string, Set<string>>; // userId -> Set of related userIds

  constructor(redis: Redis) {
    this.redis = redis;
    this.relationshipGraph = new Map();
  }

  async canReadTweet(userId: string, tweetAuthorId: string, tweetVisibility: 'public' | 'private' | 'followers'): Promise<boolean> {
    if (tweetVisibility === 'public') {
      return true;
    }

    if (userId === tweetAuthorId) {
      return true;
    }

    if (tweetVisibility === 'followers') {
      return this.checkRelationship(userId, tweetAuthorId, 'follower');
    }

    return false;
  }

  async canWriteTweet(userId: string): Promise<boolean> {
    // Check if user is blocked
    const isBlocked = await this.redis.get(`user:${userId}:blocked`);
    return !isBlocked;
  }

  async canDeleteTweet(userId: string, tweetAuthorId: string, isAdmin: boolean): Promise<boolean> {
    return userId === tweetAuthorId || isAdmin;
  }

  async checkRelationship(userId: string, targetUserId: string, relationship: 'follower' | 'following' | 'blocked' | 'muted'): Promise<boolean> {
    // Check cache first
    const cacheKey = `relationship:${userId}:${targetUserId}:${relationship}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached !== null) {
      return cached === '1';
    }

    // Simulate relationship check
    const hasRelationship = this.relationshipGraph.get(userId)?.has(targetUserId) || false;

    // Cache result for 5 minutes
    await this.redis.setex(cacheKey, 300, hasRelationship ? '1' : '0');

    return hasRelationship;
  }

  async batchCheckRelationships(checks: RelationshipCheck[]): Promise<boolean[]> {
    const pipeline = this.redis.pipeline();
    
    checks.forEach(check => {
      const cacheKey = `relationship:${check.userId}:${check.targetUserId}:${check.relationship}`;
      pipeline.get(cacheKey);
    });

    const results = await pipeline.exec();
    
    return results?.map((result, index) => {
      if (result && result[1] !== null) {
        return result[1] === '1';
      }
      // Fallback to in-memory check
      return this.relationshipGraph.get(checks[index].userId)?.has(checks[index].targetUserId) || false;
    }) || [];
  }

  async addRelationship(userId: string, targetUserId: string, relationship: string): Promise<void> {
    if (!this.relationshipGraph.has(userId)) {
      this.relationshipGraph.set(userId, new Set());
    }
    this.relationshipGraph.get(userId)!.add(targetUserId);

    // Invalidate cache
    const cacheKey = `relationship:${userId}:${targetUserId}:${relationship}`;
    await this.redis.del(cacheKey);
  }
}
