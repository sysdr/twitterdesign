export interface ConnectionPoolConfig {
  minConnections: number;
  maxConnections: number;
  currentConnections: number;
  acquireTimeout: number;
  idleTimeout: number;
}

export interface PoolMetrics {
  timestamp: number;
  activeConnections: number;
  waitingRequests: number;
  arrivalRate: number;
  serviceTime: number;
  utilization: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  queueProbability: number;
  recommendedPoolSize: number;
}

export interface QueryStats {
  queryId: string;
  sql: string;
  estimatedCost: number;
  actualCost: number;
  estimatedRows: number;
  actualRows: number;
  executionTime: number;
  selectivity: number;
}

export interface TableHistogram {
  tableName: string;
  columnName: string;
  buckets: HistogramBucket[];
  totalRows: number;
  distinctValues: number;
}

export interface HistogramBucket {
  minValue: number;
  maxValue: number;
  frequency: number;
  cumulativeFrequency: number;
}

export interface OptimizationRecommendation {
  type: 'pool_size' | 'query_hint' | 'index' | 'connection_timeout';
  priority: 'high' | 'medium' | 'low';
  currentValue: number;
  recommendedValue: number;
  expectedImprovement: string;
  reasoning: string;
}
