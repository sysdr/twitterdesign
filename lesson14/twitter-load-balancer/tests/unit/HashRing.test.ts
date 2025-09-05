import { HashRing } from '../../src/lib/consistent-hashing/HashRing';
import { Server } from '../../src/types';

describe('HashRing', () => {
  const mockServers: Server[] = [
    { id: 'server1', host: 'localhost', port: 8001, region: 'us-east', status: 'healthy', load: 0, responseTime: 50, lastHealthCheck: new Date() },
    { id: 'server2', host: 'localhost', port: 8002, region: 'us-east', status: 'healthy', load: 0, responseTime: 50, lastHealthCheck: new Date() },
    { id: 'server3', host: 'localhost', port: 8003, region: 'us-west', status: 'healthy', load: 0, responseTime: 50, lastHealthCheck: new Date() }
  ];

  test('should distribute requests evenly', () => {
    const ring = new HashRing(mockServers);
    const distribution: Record<string, number> = {};
    
    // Simulate 1000 requests
    for (let i = 0; i < 1000; i++) {
      const server = ring.getServer(`request-${i}`);
      if (server) {
        distribution[server.id] = (distribution[server.id] || 0) + 1;
      }
    }
    
    // Check that distribution is reasonably even (within 40% of average)
    const values = Object.values(distribution);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const maxDeviation = average * 0.4;
    
    values.forEach(count => {
      expect(Math.abs(count - average)).toBeLessThan(maxDeviation);
    });
  });

  test('should handle server removal gracefully', () => {
    const ring = new HashRing(mockServers);
    
    // Get initial server for a request
    const initialServer = ring.getServer('test-request');
    
    // Remove a server
    ring.removeServer('server1');
    
    // Same request should still get routed (potentially to different server)
    const newServer = ring.getServer('test-request');
    expect(newServer).toBeTruthy();
  });

  test('should respect bounded loads', () => {
    const ring = new HashRing(mockServers);
    const serverLoads = new Map([
      ['server1', 100],
      ['server2', 50],
      ['server3', 25]
    ]);
    
    // Server with high load should be avoided
    const server = ring.getServerWithBounds('test-request', serverLoads, 75);
    expect(server?.id).not.toBe('server1');
  });
});
