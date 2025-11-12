import { describe, it, expect } from 'vitest';
import { CapacityPlanner } from '../src/services/CapacityPlanner';
import { QueueMetrics } from '../src/types';

describe('CapacityPlanner', () => {
  it('generates scaling recommendation for high utilization', () => {
    const planner = new CapacityPlanner();
    const metrics: QueueMetrics = {
      arrivalRate: 90,
      serviceRate: 100,
      queueLength: 9,
      utilization: 0.9,
      averageWaitTime: 0.1,
      timestamp: Date.now()
    };

    const prediction = planner.predictQueueBehavior('test', metrics, 1, 0);
    expect(prediction.scalingRecommendation.action).toBe('scale_up');
  });

  it('recommends no action for healthy systems', () => {
    const planner = new CapacityPlanner();
    const metrics: QueueMetrics = {
      arrivalRate: 50,
      serviceRate: 100,
      queueLength: 1,
      utilization: 0.5,
      averageWaitTime: 0.02,
      timestamp: Date.now()
    };

    const prediction = planner.predictQueueBehavior('test', metrics, 2, 0);
    expect(prediction.scalingRecommendation.action).toBe('none');
  });
});
