import { ABTest } from '../src/ab-testing/ABTest';

describe('ABTest', () => {
  test('should record metrics for control and experiment groups', () => {
    const test = new ABTest({
      name: 'Test A',
      controlConfig: { setting: 1 },
      experimentConfig: { setting: 2 },
      trafficPercentage: 50,
      maxDuration: 24,
      metrics: ['latency', 'errorRate']
    });

    // Record metrics
    for (let i = 0; i < 100; i++) {
      test.recordMetric('latency', 100 + Math.random() * 20, 'control');
      test.recordMetric('latency', 90 + Math.random() * 20, 'experiment');
    }

    expect(test.getStatus()).toBe('running');
  });

  test('should detect significant improvements', () => {
    const test = new ABTest({
      name: 'Test B',
      controlConfig: { setting: 1 },
      experimentConfig: { setting: 2 },
      trafficPercentage: 50,
      maxDuration: 24,
      metrics: ['latency']
    });

    // Control: mean = 100
    // Experiment: mean = 80 (20% improvement)
    for (let i = 0; i < 200; i++) {
      test.recordMetric('latency', 100 + (Math.random() - 0.5) * 10, 'control');
      test.recordMetric('latency', 80 + (Math.random() - 0.5) * 10, 'experiment');
    }

    const results = test.getResults();
    const latencyResult = results.find(r => r.metric === 'latency');
    
    expect(latencyResult).toBeDefined();
    expect(latencyResult!.experimentMean).toBeLessThan(latencyResult!.controlMean);
  });
});
