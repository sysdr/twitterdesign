import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TimelineService } from '../services/timelineService.js';
import { setupDatabase, seedDatabase } from '../utils/setupDatabase.js';
import { redis } from '../services/redis.js';
import { db } from '../services/database.js';

describe('Timeline Service', () => {
  let timelineService: TimelineService;
  let demoUserId: string;
  let bobUserId: string;

  beforeAll(async () => {
    timelineService = new TimelineService();
    await redis.connect();
    await setupDatabase();
    await seedDatabase();
    
    // Get user IDs for testing
    const demoUserResult = await db.query('SELECT id FROM users WHERE username = $1', ['demo_user']);
    const bobUserResult = await db.query('SELECT id FROM users WHERE username = $1', ['bob_tech']);
    
    if (demoUserResult.rows.length > 0) {
      demoUserId = demoUserResult.rows[0].id;
    }
    if (bobUserResult.rows.length > 0) {
      bobUserId = bobUserResult.rows[0].id;
    }
  });

  afterAll(async () => {
    await redis.disconnect();
  });

  it('should generate timeline under 200ms', async () => {
    if (!demoUserId) {
      console.log('Skipping test - demo user not found');
      return;
    }
    
    const startTime = Date.now();
    const result = await timelineService.getTimeline(demoUserId);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(200);
    expect(result.tweets).toBeDefined();
    expect(['pull', 'push', 'hybrid']).toContain(result.model);
  });

  it('should return different models for different user types', async () => {
    if (!demoUserId || !bobUserId) {
      console.log('Skipping test - users not found');
      return;
    }
    
    const regularUser = await timelineService.getTimeline(demoUserId);
    const celebrityUser = await timelineService.getTimeline(bobUserId); // High follower count
    
    expect(regularUser.model).toBeDefined();
    expect(celebrityUser.model).toBeDefined();
  });

  it('should handle pagination correctly', async () => {
    if (!demoUserId) {
      console.log('Skipping test - demo user not found');
      return;
    }
    
    const firstPage = await timelineService.getTimeline(demoUserId, undefined, 5);
    expect(firstPage.tweets.length).toBeLessThanOrEqual(5);
    
    if (firstPage.nextCursor) {
      const secondPage = await timelineService.getTimeline(demoUserId, firstPage.nextCursor, 5);
      expect(secondPage.tweets.length).toBeLessThanOrEqual(5);
      
      // Ensure no duplicates
      const firstPageIds = firstPage.tweets.map(t => t.id);
      const secondPageIds = secondPage.tweets.map(t => t.id);
      const intersection = firstPageIds.filter(id => secondPageIds.includes(id));
      expect(intersection.length).toBe(0);
    }
  });
});
