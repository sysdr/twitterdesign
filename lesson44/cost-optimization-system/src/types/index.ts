export interface CostMetrics {
  timestamp: Date;
  computeCost: number;
  databaseCost: number;
  cacheCost: number;
  networkCost: number;
  totalCost: number;
}

export interface ResourceMetrics {
  timestamp: Date;
  cpuUtilization: number;
  memoryUtilization: number;
  requestRate: number;
  p95Latency: number;
  activeInstances: number;
}

export interface OptimizationRecommendation {
  id: string;
  type: 'scale_down' | 'scale_up' | 'instance_type' | 'caching' | 'spot_instance';
  description: string;
  estimatedSavings: number;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface BudgetAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  currentCost: number;
  budgetLimit: number;
  timestamp: Date;
}

export interface CostForecast {
  date: Date;
  predictedCost: number;
  confidence: number;
  upperBound: number;
  lowerBound: number;
}

export interface InstanceConfig {
  type: string;
  count: number;
  hourlyCost: number;
  cpuCapacity: number;
  memoryCapacity: number;
}

export interface ScalingDecision {
  action: 'scale_up' | 'scale_down' | 'optimize' | 'no_action';
  reason: string;
  timestamp: Date;
  costImpact: number;
  performanceImpact: string;
}
