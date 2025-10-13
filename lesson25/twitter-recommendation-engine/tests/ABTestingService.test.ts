import { describe, it, expect, beforeEach } from 'vitest';
import { ABTestingService } from '../src/services/ABTestingService';
import { ExperimentConfig } from '../src/types';

describe('ABTestingService', () => {
  let service: ABTestingService;

  beforeEach(() => {
    service = new ABTestingService();
  });

  it('should assign users to experiment variants consistently', () => {
    const experiment: ExperimentConfig = {
      id: 'test-exp',
      name: 'Test Experiment',
      description: 'Test',
      isActive: true,
      trafficPercentage: 100,
      variants: [
        { id: 'control', name: 'Control', weight: 0.5, config: {} },
        { id: 'treatment', name: 'Treatment', weight: 0.5, config: {} }
      ]
    };

    service.createExperiment(experiment);

    const userId = 'user-123';
    const variant1 = service.assignUserToVariant(userId, 'test-exp');
    const variant2 = service.assignUserToVariant(userId, 'test-exp');

    expect(variant1).toBeDefined();
    expect(variant1).toBe(variant2); // Should be consistent
  });

  it('should respect traffic percentage', () => {
    const experiment: ExperimentConfig = {
      id: 'low-traffic-exp',
      name: 'Low Traffic',
      description: 'Test',
      isActive: true,
      trafficPercentage: 0, // No users should be included
      variants: [
        { id: 'control', name: 'Control', weight: 1.0, config: {} }
      ]
    };

    service.createExperiment(experiment);

    const variant = service.assignUserToVariant('user-123', 'low-traffic-exp');
    expect(variant).toBeNull();
  });

  it('should track and aggregate results', () => {
    const experiment: ExperimentConfig = {
      id: 'metrics-exp',
      name: 'Metrics Test',
      description: 'Test',
      isActive: true,
      trafficPercentage: 100,
      variants: [
        { id: 'variant-a', name: 'Variant A', weight: 1.0, config: {} }
      ]
    };

    service.createExperiment(experiment);
    service.assignUserToVariant('user-1', 'metrics-exp');

    service.trackResult({
      experimentId: 'metrics-exp',
      variantId: 'variant-a',
      userId: 'user-1',
      metrics: { clicks: 1, views: 5 }
    });

    const results = service.getExperimentResults('metrics-exp');
    expect(results.has('variant-a')).toBe(true);
    
    const variantResult = results.get('variant-a');
    expect(variantResult?.count).toBe(1);
    expect(variantResult?.metrics.clicks).toBe(1);
    expect(variantResult?.metrics.views).toBe(5);
  });
});
