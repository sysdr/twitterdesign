import { RegionalCollector } from '../src/collectors/RegionalCollector';

describe('RegionalCollector', () => {
  let collector: RegionalCollector;

  beforeEach(() => {
    collector = new RegionalCollector('test-region');
  });

  afterEach(() => {
    collector.stopCollection();
  });

  test('should emit metrics when collection starts', (done) => {
    collector.on('metrics', (metrics) => {
      expect(metrics).toHaveLength(6);
      expect(metrics[0]).toHaveProperty('regionId', 'test-region');
      expect(metrics[0]).toHaveProperty('timestamp');
      expect(metrics[0]).toHaveProperty('type');
      expect(metrics[0]).toHaveProperty('value');
      collector.stopCollection(); // Stop collection before calling done
      done();
    });

    collector.startCollection();
  }, 10000); // Increase timeout to 10 seconds

  test('should simulate issues correctly', () => {
    const initialVariance = (collector as any).simulationVariance;
    collector.simulateIssue('major');
    expect((collector as any).simulationVariance).toBeLessThan(initialVariance);
  });
});
