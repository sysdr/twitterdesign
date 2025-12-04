import { CostTracker } from '../src/services/CostTracker';

describe('CostTracker', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker('t3.medium');
  });

  test('should track request costs accurately', () => {
    const cost = tracker.trackRequest(1, 10, 5, 20, 1024);
    
    expect(cost.totalCost).toBeGreaterThan(0);
    expect(cost.computeCost).toBeGreaterThan(0);
    expect(cost.databaseCost).toBeGreaterThan(0);
    expect(cost.cacheCost).toBeGreaterThan(0);
  });

  test('should calculate projected daily cost', () => {
    for (let i = 0; i < 10; i++) {
      tracker.trackRequest(1, 10, 5, 20, 1024);
    }

    const projected = tracker.getProjectedDailyCost();
    expect(projected).toBeGreaterThan(0);
  });

  test('should provide cost breakdown', () => {
    tracker.trackRequest(1, 10, 5, 20, 1024);
    const breakdown = tracker.getCostBreakdown();

    expect(breakdown).toHaveProperty('compute');
    expect(breakdown).toHaveProperty('database');
    expect(breakdown).toHaveProperty('cache');
    expect(breakdown).toHaveProperty('network');
  });
});
