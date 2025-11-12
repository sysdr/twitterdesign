import { describe, it, expect } from 'vitest';
import { QueuingTheoryModel } from '../src/models/QueuingTheory';

describe('QueuingTheoryModel', () => {
  it('calculates Littles Law correctly', () => {
    const L = QueuingTheoryModel.calculateLittlesLaw(10, 2);
    expect(L).toBe(20);
  });

  it('calculates utilization correctly', () => {
    const utilization = QueuingTheoryModel.calculateUtilization(80, 100);
    expect(utilization).toBe(0.8);
  });

  it('calculates M/M/1 wait time', () => {
    const waitTime = QueuingTheoryModel.calculateAverageWaitTime(80, 100);
    expect(waitTime).toBe(0.05);
  });

  it('calculates queue length', () => {
    const queueLength = QueuingTheoryModel.calculateQueueLength(80, 100);
    expect(queueLength).toBeCloseTo(4, 6);
  });

  it('determines health status correctly', () => {
    expect(QueuingTheoryModel.determineHealth(0.5)).toBe('healthy');
    expect(QueuingTheoryModel.determineHealth(0.75)).toBe('warning');
    expect(QueuingTheoryModel.determineHealth(0.9)).toBe('critical');
  });

  it('calculates optimal servers', () => {
    const servers = QueuingTheoryModel.calculateOptimalServers(70, 10, 0.7);
    expect(servers).toBeGreaterThanOrEqual(10);
  });
});
