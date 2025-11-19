import { TableHistogram, HistogramBucket } from '../types';

// Estimate selectivity from histogram
export function estimateSelectivity(
  histogram: TableHistogram,
  minValue: number,
  maxValue: number
): number {
  let matchingRows = 0;
  
  for (const bucket of histogram.buckets) {
    if (bucket.maxValue < minValue || bucket.minValue > maxValue) {
      continue;
    }
    
    // Calculate overlap ratio
    const overlapMin = Math.max(bucket.minValue, minValue);
    const overlapMax = Math.min(bucket.maxValue, maxValue);
    const bucketRange = bucket.maxValue - bucket.minValue || 1;
    const overlapRatio = (overlapMax - overlapMin) / bucketRange;
    
    matchingRows += bucket.frequency * overlapRatio;
  }
  
  return matchingRows / histogram.totalRows;
}

// Estimate query cost
export function estimateQueryCost(
  selectivity: number,
  tableSize: number,
  hasIndex: boolean,
  indexDepth: number = 3
): { scanCost: number; indexCost: number; recommendedPlan: string } {
  const IO_COST = 1;
  const CPU_COST = 0.01;
  
  // Full table scan cost
  const scanCost = tableSize * IO_COST + tableSize * CPU_COST;
  
  // Index scan cost with penalty for high selectivity/random access
  const matchingRows = selectivity * tableSize;
  const selectivityPenalty = selectivity * tableSize * 0.2 * IO_COST;
  const indexCost = hasIndex
    ? indexDepth * IO_COST + matchingRows * (IO_COST + CPU_COST) + selectivityPenalty
    : Infinity;
  
  const recommendedPlan =
    !hasIndex || selectivity > 0.3 || indexCost >= scanCost ? 'TABLE_SCAN' : 'INDEX_SCAN';
  
  return {
    scanCost,
    indexCost,
    recommendedPlan
  };
}

// Build histogram from data
export function buildHistogram(
  values: number[],
  numBuckets: number = 10
): HistogramBucket[] {
  if (values.length === 0) return [];
  
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const bucketWidth = (max - min) / numBuckets || 1;
  
  const buckets: HistogramBucket[] = [];
  let cumulative = 0;
  
  for (let i = 0; i < numBuckets; i++) {
    const bucketMin = min + i * bucketWidth;
    const bucketMax = i === numBuckets - 1 ? max : min + (i + 1) * bucketWidth;
    
    const frequency = sorted.filter(
      v => v >= bucketMin && (i === numBuckets - 1 ? v <= bucketMax : v < bucketMax)
    ).length;
    
    cumulative += frequency;
    
    buckets.push({
      minValue: bucketMin,
      maxValue: bucketMax,
      frequency,
      cumulativeFrequency: cumulative
    });
  }
  
  return buckets;
}

// Calculate cardinality (distinct values)
export function calculateCardinality(values: number[]): number {
  return new Set(values).size;
}

// Detect correlation between columns
export function calculateCorrelation(
  column1: number[],
  column2: number[]
): number {
  if (column1.length !== column2.length || column1.length === 0) return 0;
  
  const n = column1.length;
  const mean1 = column1.reduce((a, b) => a + b, 0) / n;
  const mean2 = column2.reduce((a, b) => a + b, 0) / n;
  
  let covariance = 0;
  let var1 = 0;
  let var2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = column1[i] - mean1;
    const diff2 = column2[i] - mean2;
    covariance += diff1 * diff2;
    var1 += diff1 * diff1;
    var2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(var1 * var2);
  return denominator === 0 ? 0 : covariance / denominator;
}
