import { TimelineService } from '../src/services/TimelineService';
import { ShardManager } from '../src/services/ShardManager';
import { CacheManager } from '../src/services/CacheManager';

// Mock dependencies
jest.mock('../src/services/ShardManager');
jest.mock('../src/services/CacheManager');

describe('TimelineService', () => {
  let timelineService: TimelineService;
  let mockShardManager: jest.Mocked<ShardManager>;
  let mockCacheManager: jest.Mocked<CacheManager>;

  beforeEach(() => {
    mockShardManager = new ShardManager() as jest.Mocked<ShardManager>;
    mockCacheManager = new CacheManager() as jest.Mocked<CacheManager>;
    timelineService = new TimelineService(mockShardManager, mockCacheManager);
  });

  test('should generate timeline from multiple shards', async () => {
    // Setup mocks
    mockCacheManager.get.mockResolvedValue(null); // Cache miss
    mockShardManager.identifyShards.mockReturnValue([0]);
    mockShardManager.getShardForUser.mockReturnValue(0);
    
    // Mock the query method to return different results based on the query
    mockShardManager.query.mockImplementation((shardId: number, sql: string, params?: any[]) => {
      if (sql.includes('followed_user_id')) {
        // Follows query
        return Promise.resolve([{ followed_user_id: 'user1' }]);
      } else if (sql.includes('tweets')) {
        // Tweets query
        return Promise.resolve([{
          id: 'tweet1',
          user_id: 'user1',
          content: 'Test tweet',
          created_at: '2024-01-01T10:00:00Z',
          likes_count: 5,
          retweets_count: 2
        }]);
      }
      return Promise.resolve([]);
    });

    mockCacheManager.set.mockResolvedValue();

    const result = await timelineService.generateTimeline('testUser', 10, 0);
    
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Test tweet');
    expect(mockCacheManager.set).toHaveBeenCalled();
  });

  test('should handle cache hits', async () => {
    const cachedTimeline = JSON.stringify([{
      id: 'cached_tweet',
      content: 'Cached content'
    }]);
    
    mockCacheManager.get.mockResolvedValue(cachedTimeline);
    
    const result = await timelineService.generateTimeline('testUser', 10, 0);
    
    expect(result[0].content).toBe('Cached content');
    expect(mockShardManager.query).not.toHaveBeenCalled();
  });

  test('should handle shard failures gracefully', async () => {
    mockCacheManager.get.mockResolvedValue(null);
    mockShardManager.identifyShards.mockReturnValue([0, 1]);
    mockShardManager.query
      .mockResolvedValueOnce([{ followed_user_id: 'user1' }])
      .mockRejectedValueOnce(new Error('Shard failure'))
      .mockResolvedValueOnce([{
        id: 'tweet1',
        user_id: 'user1',
        content: 'Working shard tweet',
        created_at: '2024-01-01T10:00:00Z',
        likes_count: 1,
        retweets_count: 0
      }]);

    mockShardManager.getShardForUser.mockReturnValue(0);
    mockCacheManager.set.mockResolvedValue();

    const result = await timelineService.generateTimeline('testUser', 10, 0);
    
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Working shard tweet');
  });
});
