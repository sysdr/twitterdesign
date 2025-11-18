import { describe, it, expect, beforeEach } from 'vitest';
import { WeightedHashRing } from '../src/lib/hashing/hashRing';
import { Server } from '../src/types';

describe('WeightedHashRing', () => {
  let ring: WeightedHashRing;

  beforeEach(() => {
    ring = new WeightedHashRing(100);
  });

  const createServer = (id: string, capacity: number, weight: number): Server => ({
    id,
    name: `Server-${id}`,
    capacity,
    currentLoad: 0,
    cpu: 20,
    memory: 30,
    responseTime: 10,
    virtualNodes: 0,
    weight,
    effectiveWeight: weight,
    status: 'healthy'
  });

  it('should distribute requests based on weight', () => {
    ring.addServer(createServer('s1', 100, 1.0));
    ring.addServer(createServer('s2', 200, 2.0));

    const counts: Record<string, number> = { s1: 0, s2: 0 };
    
    for (let i = 0; i < 1000; i++) {
      const server = ring.getServer(`request-${i}`);
      if (server) counts[server]++;
    }

    // s2 should get roughly 2x traffic
    const ratio = counts.s2 / counts.s1;
    expect(ratio).toBeGreaterThan(1.5);
    expect(ratio).toBeLessThan(2.5);
  });

  it('should maintain consistency for same key', () => {
    ring.addServer(createServer('s1', 100, 1.0));
    ring.addServer(createServer('s2', 100, 1.0));

    const key = 'test-key';
    const first = ring.getServer(key);
    
    for (let i = 0; i < 100; i++) {
      expect(ring.getServer(key)).toBe(first);
    }
  });

  it('should find next server excluding specified ones', () => {
    ring.addServer(createServer('s1', 100, 1.0));
    ring.addServer(createServer('s2', 100, 1.0));
    ring.addServer(createServer('s3', 100, 1.0));

    const key = 'test-key';
    const primary = ring.getServer(key);
    const skip = new Set([primary!]);
    const next = ring.getNextServer(key, skip);

    expect(next).not.toBe(primary);
    expect(next).toBeTruthy();
  });

  it('should update virtual nodes when weight changes', () => {
    ring.addServer(createServer('s1', 100, 1.0));
    const before = ring.getServers()[0].virtualNodes;
    
    ring.updateServerWeight('s1', 2.0);
    const after = ring.getServers()[0].virtualNodes;
    
    expect(after).toBeGreaterThan(before);
  });
});
