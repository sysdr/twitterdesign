import {
  estimateSelectivity,
  estimateQueryCost,
  buildHistogram,
  calculateCardinality,
  calculateCorrelation
} from './queryOptimizer';
import { TableHistogram } from '../types';

describe('Query Optimizer Utilities', () => {
  describe('buildHistogram', () => {
    it('creates correct number of buckets', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const buckets = buildHistogram(values, 5);
      expect(buckets.length).toBe(5);
    });

    it('maintains cumulative frequency', () => {
      const values = [1, 2, 3, 4, 5];
      const buckets = buildHistogram(values, 5);
      const lastBucket = buckets[buckets.length - 1];
      expect(lastBucket.cumulativeFrequency).toBe(5);
    });
  });

  describe('estimateSelectivity', () => {
    it('estimates selectivity from histogram', () => {
      const values = Array.from({ length: 100 }, (_, i) => i);
      const buckets = buildHistogram(values, 10);
      const histogram: TableHistogram = {
        tableName: 'test',
        columnName: 'id',
        buckets,
        totalRows: 100,
        distinctValues: 100
      };
      
      const selectivity = estimateSelectivity(histogram, 0, 10);
      expect(selectivity).toBeCloseTo(0.1, 1);
    });
  });

  describe('estimateQueryCost', () => {
    it('recommends index scan for low selectivity', () => {
      const result = estimateQueryCost(0.01, 10000, true);
      expect(result.recommendedPlan).toBe('INDEX_SCAN');
    });

    it('recommends table scan for high selectivity', () => {
      const result = estimateQueryCost(0.9, 10000, true);
      expect(result.recommendedPlan).toBe('TABLE_SCAN');
    });

    it('recommends table scan when no index', () => {
      const result = estimateQueryCost(0.01, 10000, false);
      expect(result.recommendedPlan).toBe('TABLE_SCAN');
    });
  });

  describe('calculateCardinality', () => {
    it('counts distinct values', () => {
      expect(calculateCardinality([1, 2, 3, 3, 4, 4, 4])).toBe(4);
    });
  });

  describe('calculateCorrelation', () => {
    it('returns 1 for perfect correlation', () => {
      const col1 = [1, 2, 3, 4, 5];
      const col2 = [2, 4, 6, 8, 10];
      expect(calculateCorrelation(col1, col2)).toBeCloseTo(1, 5);
    });

    it('returns -1 for negative correlation', () => {
      const col1 = [1, 2, 3, 4, 5];
      const col2 = [5, 4, 3, 2, 1];
      expect(calculateCorrelation(col1, col2)).toBeCloseTo(-1, 5);
    });
  });
});
