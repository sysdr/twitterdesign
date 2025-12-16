import { MetricsCollector } from '../../src/services/metricsCollector';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  test('should initialize with 3 servers', () => {
    const servers = collector.getCurrentServers();
    expect(servers.length).toBe(3);
  });

  test('should collect metrics from all servers', async () => {
    const metrics = await collector.collectMetrics();
    expect(metrics.length).toBe(3);
    expect(metrics[0]).toHaveProperty('cpuUsage');
    expect(metrics[0]).toHaveProperty('requestRate');
  });

  test('should add new server', () => {
    const newServer = {
      id: 'test-server',
      status: 'running' as const,
      region: 'us-east-1',
      capacity: 250,
      cost: 0.10,
      launchedAt: new Date()
    };
    collector.addServer(newServer);
    const servers = collector.getCurrentServers();
    expect(servers.length).toBe(4);
  });
});
