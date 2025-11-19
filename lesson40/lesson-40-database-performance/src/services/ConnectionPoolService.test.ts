import { ConnectionPoolService } from './ConnectionPoolService';

describe('ConnectionPoolService', () => {
  let service: ConnectionPoolService;

  beforeEach(() => {
    service = new ConnectionPoolService({
      minConnections: 5,
      maxConnections: 100,
      currentConnections: 20,
      acquireTimeout: 5000,
      idleTimeout: 30000
    });
  });

  describe('simulateQuery', () => {
    it('returns latency and queued status', () => {
      const result = service.simulateQuery();
      expect(result).toHaveProperty('latency');
      expect(result).toHaveProperty('queued');
      expect(typeof result.latency).toBe('number');
      expect(typeof result.queued).toBe('boolean');
    });
  });

  describe('getMetrics', () => {
    it('returns valid metrics object', () => {
      // Generate some load
      for (let i = 0; i < 10; i++) {
        service.simulateQuery();
      }

      const metrics = service.getMetrics();
      expect(metrics).toHaveProperty('timestamp');
      expect(metrics).toHaveProperty('utilization');
      expect(metrics).toHaveProperty('p50Latency');
      expect(metrics).toHaveProperty('p95Latency');
      expect(metrics).toHaveProperty('p99Latency');
      expect(metrics).toHaveProperty('recommendedPoolSize');
    });

    it('produces non-zero throughput after sustained load', () => {
      for (let i = 0; i < 200; i++) {
        service.simulateQuery();
      }

      const metrics = service.getMetrics();
      expect(metrics.activeConnections).toBeGreaterThan(0);
      expect(metrics.arrivalRate).toBeGreaterThan(0);
      expect(metrics.p50Latency).toBeGreaterThan(0);
    });
  });

  describe('getRecommendations', () => {
    it('returns array of recommendations', () => {
      const recommendations = service.getRecommendations();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('updates pool configuration', () => {
      service.updateConfig({ currentConnections: 50 });
      const metrics = service.getMetrics();
      expect(metrics).toBeDefined();
    });
  });
});
