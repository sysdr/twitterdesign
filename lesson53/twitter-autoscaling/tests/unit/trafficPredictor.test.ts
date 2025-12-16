import { TrafficPredictor } from '../../src/services/trafficPredictor';
import { SystemMetrics } from '../../src/models/types';

describe('TrafficPredictor', () => {
  let predictor: TrafficPredictor;

  beforeEach(() => {
    predictor = new TrafficPredictor();
  });

  test('should predict traffic with minimal data', async () => {
    const metrics: SystemMetrics[] = [
      {
        timestamp: new Date(),
        serverId: 'server-1',
        cpuUsage: 50,
        memoryUsage: 60,
        requestRate: 100,
        activeConnections: 50,
        responseTime: 150
      }
    ];
    
    const prediction = await predictor.predictNextHour(metrics);
    expect(prediction.predictedRequestRate).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThan(0);
  });
});
