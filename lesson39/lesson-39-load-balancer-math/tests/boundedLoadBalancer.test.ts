import { describe, it, expect, beforeEach } from 'vitest';
import { BoundedLoadBalancer } from '../src/lib/balancer/boundedLoadBalancer';
import { Server, LoadBalancerConfig } from '../src/types';

describe('BoundedLoadBalancer', () => {
  let balancer: BoundedLoadBalancer;
  const config: LoadBalancerConfig = {
    epsilon: 0.25,
    baseVirtualNodes: 100,
    healthWeights: {
      cpu: 0.4,
      memory: 0.3,
      responseTime: 0.3
    },
    updateInterval: 1000
  };

  beforeEach(() => {
    balancer = new BoundedLoadBalancer(config);
  });

  const createServer = (id: string, capacity: number): Server => ({
    id,
    name: `Server-${id}`,
    capacity,
    currentLoad: 0,
    cpu: 20,
    memory: 30,
    responseTime: 10,
    virtualNodes: 0,
    weight: 1.0,
    effectiveWeight: 1.0,
    status: 'healthy'
  });

  it('should route requests to servers', () => {
    balancer.addServer(createServer('s1', 100));
    balancer.addServer(createServer('s2', 100));

    const decision = balancer.route('test-request');
    
    expect(decision.actualServer).toBeTruthy();
    expect(['s1', 's2']).toContain(decision.actualServer);
  });

  it('should respect bounded loads', () => {
    balancer.addServer(createServer('s1', 100));
    balancer.addServer(createServer('s2', 100));

    // Send many requests
    for (let i = 0; i < 1000; i++) {
      balancer.route(`request-${i}`);
    }

    const servers = balancer.getServers();
    const loads = servers.map(s => s.currentLoad);
    const avg = loads.reduce((a, b) => a + b, 0) / loads.length;
    const maxAllowed = Math.ceil((1 + config.epsilon) * avg);

    // All servers should be at or below bound
    loads.forEach(load => {
      expect(load).toBeLessThanOrEqual(maxAllowed + 1);
    });
  });

  it('should track spillover events', () => {
    balancer.addServer(createServer('s1', 10));
    balancer.addServer(createServer('s2', 10));

    // Send enough requests to cause spillover
    for (let i = 0; i < 100; i++) {
      balancer.route(`request-${i}`);
    }

    const metrics = balancer.getMetrics();
    expect(metrics.spilloverCount).toBeGreaterThan(0);
  });

  it('should maintain low load variance', () => {
    balancer.addServer(createServer('s1', 100));
    balancer.addServer(createServer('s2', 100));
    balancer.addServer(createServer('s3', 100));

    for (let i = 0; i < 1000; i++) {
      balancer.route(`request-${i}`);
    }

    const metrics = balancer.getMetrics();
    // Variance should be less than 10%
    expect(metrics.loadVariance).toBeLessThan(10);
  });

  it('should adjust effective weight based on health', () => {
    balancer.addServer(createServer('s1', 100));
    
    const before = balancer.getServers()[0].effectiveWeight;
    
    balancer.updateServerMetrics('s1', {
      cpu: 90,
      memory: 80,
      responseTime: 500
    });
    
    const after = balancer.getServers()[0].effectiveWeight;
    expect(after).toBeLessThan(before);
  });

  it('should calculate correct server status', () => {
    balancer.addServer(createServer('s1', 100));
    
    // Simulate high load
    for (let i = 0; i < 95; i++) {
      balancer.route(`req-${i}`);
    }
    
    balancer.updateServerMetrics('s1', { currentLoad: 95 });
    const server = balancer.getServers()[0];
    
    expect(['critical', 'overloaded']).toContain(server.status);
  });
});
