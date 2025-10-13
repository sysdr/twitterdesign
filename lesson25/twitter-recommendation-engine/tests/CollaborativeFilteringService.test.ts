import { describe, it, expect, beforeEach } from 'vitest';
import { CollaborativeFilteringService } from '../src/services/CollaborativeFilteringService';
import { UserInteraction } from '../src/types';

describe('CollaborativeFilteringService', () => {
  let service: CollaborativeFilteringService;

  beforeEach(() => {
    service = new CollaborativeFilteringService();
  });

  it('should generate recommendations for user', async () => {
    // Initialize sample data
    service.initializeSampleData();

    const request = {
      userId: 'user-1',
      limit: 10,
      excludeIds: []
    };

    const response = await service.generateRecommendations(request);

    expect(response.tweets).toBeDefined();
    expect(response.tweets.length).toBeLessThanOrEqual(10);
    expect(response.debugInfo).toBeDefined();
    expect(response.debugInfo?.processingTime).toBeGreaterThan(0);
  });

  it('should update user embeddings on interaction', () => {
    const interaction: UserInteraction = {
      userId: 'user-1',
      tweetId: 'tweet-1',
      type: 'like',
      timestamp: new Date()
    };

    // This should not throw
    service.updateUserEmbedding('user-1', interaction);

    // Should be able to find similar users after interaction
    const similarUsers = service.findSimilarUsers('user-1', 5);
    expect(Array.isArray(similarUsers)).toBe(true);
  });

  it('should find similar users', () => {
    service.initializeSampleData();

    const similarUsers = service.findSimilarUsers('user-1', 5);
    
    expect(similarUsers).toBeDefined();
    expect(similarUsers.length).toBeLessThanOrEqual(5);
    
    similarUsers.forEach(user => {
      expect(user).toHaveProperty('userId');
      expect(user).toHaveProperty('similarity');
      expect(user.similarity).toBeGreaterThanOrEqual(-1);
      expect(user.similarity).toBeLessThanOrEqual(1);
    });
  });
});
