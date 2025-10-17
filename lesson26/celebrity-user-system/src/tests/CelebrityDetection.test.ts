import { describe, it, expect } from 'vitest';
import { CelebrityDetectionService } from '../services/CelebrityDetectionService';
import { User, UserTier } from '../types';

describe('CelebrityDetectionService', () => {
  const service = new CelebrityDetectionService();

  it('should classify celebrity users correctly', () => {
    const user: User = {
      id: 'test-1',
      username: 'celebrity',
      followerCount: 10_000_000,
      verified: true,
      engagementRate: 5.0,
      tier: UserTier.REGULAR, // Will be updated by service
      influenceScore: 0
    };

    const tier = service.classifyUser(user);
    expect(tier).toBe(UserTier.CELEBRITY);
  });

  it('should classify popular users correctly', () => {
    const user: User = {
      id: 'test-2',
      username: 'popular',
      followerCount: 50_000,
      verified: true,
      engagementRate: 8.0,
      tier: UserTier.REGULAR,
      influenceScore: 0
    };

    const tier = service.classifyUser(user);
    expect(tier).toBe(UserTier.POPULAR);
  });

  it('should classify regular users correctly', () => {
    const user: User = {
      id: 'test-3',
      username: 'regular',
      followerCount: 1_000,
      verified: false,
      engagementRate: 3.0,
      tier: UserTier.REGULAR,
      influenceScore: 0
    };

    const tier = service.classifyUser(user);
    expect(tier).toBe(UserTier.REGULAR);
  });

  it('should calculate influence score correctly', () => {
    const user: User = {
      id: 'test-4',
      username: 'test',
      followerCount: 100_000,
      verified: true,
      engagementRate: 10.0,
      tier: UserTier.REGULAR,
      influenceScore: 0
    };

    const score = service.calculateInfluenceScore(user);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
