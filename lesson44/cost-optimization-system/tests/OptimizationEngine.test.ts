import { OptimizationEngine } from '../src/services/OptimizationEngine';
import { ResourceMonitor } from '../src/services/ResourceMonitor';
import { CostTracker } from '../src/services/CostTracker';

describe('OptimizationEngine', () => {
  let engine: OptimizationEngine;
  let monitor: ResourceMonitor;
  let tracker: CostTracker;

  beforeEach(() => {
    monitor = new ResourceMonitor();
    tracker = new CostTracker();
    engine = new OptimizationEngine(monitor, tracker, 100);
  });

  test('should generate scaling decisions', () => {
    const decision = engine.analyzeAndOptimize();
    
    expect(decision).toHaveProperty('action');
    expect(decision).toHaveProperty('reason');
    expect(decision).toHaveProperty('costImpact');
  });

  test('should generate recommendations', () => {
    const recommendations = engine.generateRecommendations();
    
    expect(Array.isArray(recommendations)).toBe(true);
    expect(recommendations.length).toBeGreaterThan(0);
    
    recommendations.forEach(rec => {
      expect(rec).toHaveProperty('estimatedSavings');
      expect(rec).toHaveProperty('confidence');
      expect(rec.confidence).toBeGreaterThanOrEqual(0);
      expect(rec.confidence).toBeLessThanOrEqual(1);
    });
  });

  test('should respect budget constraints', () => {
    engine.setBudgetLimit(50);
    const decision = engine.analyzeAndOptimize();
    
    expect(decision.action).toBeDefined();
  });
});
