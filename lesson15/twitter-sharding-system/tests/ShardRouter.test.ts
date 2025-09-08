import { describe, it, expect } from 'vitest';
import { ShardRouter } from '../src/services/shard-router/ShardRouter';
import { ShardInfo } from '../src/types';

describe('ShardRouter', () => {
  const mockShards: ShardInfo[] = [
    { id: 1, name: 'shard-1', host: 'localhost', port: 5432, status: 'healthy', load_percentage: 50, user_count: 100, tweet_count: 500, last_health_check: new Date() },
    { id: 2, name: 'shard-2', host: 'localhost', port: 5433, status: 'healthy', load_percentage: 30, user_count: 50, tweet_count: 200, last_health_check: new Date() },
  ];

  it('should consistently route same user to same shard', () => {
    const router = new ShardRouter(mockShards);
    const userId = 'test-user-123';
    
    const shard1 = router.getShardId(userId);
    const shard2 = router.getShardId(userId);
    const shard3 = router.getShardId(userId);
    
    expect(shard1).toBe(shard2);
    expect(shard2).toBe(shard3);
  });

  it('should distribute different users across shards', () => {
    const router = new ShardRouter(mockShards);
    const shardIds = new Set();
    
    for (let i = 0; i < 100; i++) {
      const shardId = router.getShardId(`user-${i}`);
      shardIds.add(shardId);
    }
    
    expect(shardIds.size).toBeGreaterThan(1);
  });

  it('should return valid shard IDs', () => {
    const router = new ShardRouter(mockShards);
    const validShardIds = mockShards.map(s => s.id);
    
    for (let i = 0; i < 50; i++) {
      const shardId = router.getShardId(`user-${i}`);
      expect(validShardIds).toContain(shardId);
    }
  });
});
