import {
  littlesLaw,
  calculateUtilization,
  erlangC,
  averageWaitTime,
  averageResponseTime,
  optimalPoolSize
} from './queuingTheory';

describe('Queuing Theory Utilities', () => {
  describe('littlesLaw', () => {
    it('calculates average items in system', () => {
      expect(littlesLaw(100, 0.01)).toBe(1);
      expect(littlesLaw(1000, 0.01)).toBe(10);
    });
  });

  describe('calculateUtilization', () => {
    it('calculates server utilization', () => {
      const util = calculateUtilization(100, 0.01, 10);
      expect(util).toBeCloseTo(0.1, 5);
    });

    it('returns higher utilization with fewer servers', () => {
      const util1 = calculateUtilization(100, 0.01, 10);
      const util2 = calculateUtilization(100, 0.01, 5);
      expect(util2).toBeGreaterThan(util1);
    });
  });

  describe('erlangC', () => {
    it('returns 0 for low utilization', () => {
      const prob = erlangC(10, 0.1);
      expect(prob).toBeLessThan(0.01);
    });

    it('returns higher probability for high utilization', () => {
      const low = erlangC(10, 0.3);
      const high = erlangC(10, 0.8);
      expect(high).toBeGreaterThan(low);
    });

    it('returns 1 when utilization >= 1', () => {
      expect(erlangC(10, 1.5)).toBe(1);
    });
  });

  describe('averageResponseTime', () => {
    it('increases with higher utilization', () => {
      const low = averageResponseTime(10, 50, 0.01);
      const high = averageResponseTime(10, 90, 0.01);
      expect(high).toBeGreaterThan(low);
    });

    it('decreases with more servers', () => {
      const few = averageResponseTime(5, 100, 0.01);
      const many = averageResponseTime(20, 100, 0.01);
      expect(many).toBeLessThan(few);
    });
  });

  describe('optimalPoolSize', () => {
    it('calculates optimal pool for target utilization', () => {
      const size = optimalPoolSize(100, 0.01, 0.7);
      expect(size).toBe(2); // 1/0.7 = 1.43, ceil = 2
    });

    it('scales with arrival rate', () => {
      const small = optimalPoolSize(100, 0.01);
      const large = optimalPoolSize(1000, 0.01);
      expect(large).toBeGreaterThan(small);
    });
  });
});
