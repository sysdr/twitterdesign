import { MetricsCollector } from '../src/shared/metrics';
import { SLISLOManager } from '../src/monitoring/sli-slo-manager';

describe('Observability Stack Tests', () => {
  describe('MetricsCollector', () => {
    it('should initialize metrics correctly', () => {
      const metrics = MetricsCollector.getInstance();
      expect(metrics).toBeDefined();
      expect(metrics.requestDuration).toBeDefined();
      expect(metrics.sliCompliance).toBeDefined();
    });

    it('should record metrics', async () => {
      const metrics = MetricsCollector.getInstance();
      metrics.requestCount.inc({ service: 'test', method: 'GET', route: '/test', status: '200' });
      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('http_requests_total');
    });
  });

  describe('SLISLOManager', () => {
    it('should record SLI metrics', () => {
      const manager = new SLISLOManager();
      manager.recordSLI({
        name: 'timeline_latency',
        value: 0.15,
        timestamp: Date.now(),
        labels: { user_id: 'test-user' },
      });

      const status = manager.getSLOStatus();
      expect(status.length).toBeGreaterThan(0);
    });

    it('should calculate SLO compliance', () => {
      const manager = new SLISLOManager();
      
      for (let i = 0; i < 100; i++) {
        manager.recordSLI({
          name: 'timeline_latency',
          value: 0.1 + Math.random() * 0.1,
          timestamp: Date.now(),
          labels: { user_id: `user-${i}` },
        });
      }

      const status = manager.getSLOStatus();
      const timelineSLO = status.find(s => s.name === 'timeline_latency');
      expect(timelineSLO).toBeDefined();
      expect(timelineSLO?.status).toBe('healthy');
    });
  });
});
