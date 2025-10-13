import { describe, it, expect } from 'vitest';
import { RateLimitingService } from '../services/RateLimitingService';
import { UserTier } from '../types';

describe('RateLimitingService', () => {
  const service = new RateLimitingService();

  it('should allow consumption within limits', () => {
    const result = service.consumeTokens('user-1', UserTier.REGULAR, 5);
    expect(result).toBe(true);
  });

  it('should deny consumption beyond limits', () => {
    const userId = 'user-2';
    
    // Consume all tokens
    service.consumeTokens(userId, UserTier.REGULAR, 10);
    
    // Should be denied
    const result = service.consumeTokens(userId, UserTier.REGULAR, 1);
    expect(result).toBe(false);
  });

  it('should have different limits for different tiers', () => {
    const regularResult = service.consumeTokens('regular-user', UserTier.REGULAR, 15);
    const celebrityResult = service.consumeTokens('celebrity-user', UserTier.CELEBRITY, 15);
    
    expect(regularResult).toBe(false); // Regular users have lower limits
    expect(celebrityResult).toBe(true);  // Celebrity users have higher limits
  });
});
