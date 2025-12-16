import { AutoScaler } from '../../src/services/autoScaler';
import { MetricsCollector } from '../../src/services/metricsCollector';
import { TrafficPredictor } from '../../src/services/trafficPredictor';
import { AutoScalerConfig } from '../../src/models/types';

describe('AutoScaling Integration', () => {
  let autoScaler: AutoScaler;
  let metricsCollector: MetricsCollector;
  let trafficPredictor: TrafficPredictor;
  let config: AutoScalerConfig;

  beforeEach(() => {
    config = {
      minServers: 2,
      maxServers: 10,
      targetUtilization: 0.70,
      serverCapacity: 250,
      scaleUpThreshold: 0.75,
      scaleDownThreshold: 0.40,
      cooldownPeriod: 60,
      costPerServerHour: 0.10,
      maxDailyBudget: 50
    };

    metricsCollector = new MetricsCollector();
    trafficPredictor = new TrafficPredictor();
    autoScaler = new AutoScaler(config, metricsCollector, trafficPredictor);
  });

  test('should make scaling decision', async () => {
    const decision = await autoScaler.makeScalingDecision();
    expect(decision).toHaveProperty('currentServers');
    expect(decision).toHaveProperty('targetServers');
    expect(decision).toHaveProperty('approved');
  });
});
