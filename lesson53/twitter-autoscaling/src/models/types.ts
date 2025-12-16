export interface SystemMetrics {
  timestamp: Date;
  serverId: string;
  cpuUsage: number;
  memoryUsage: number;
  requestRate: number;
  activeConnections: number;
  responseTime: number;
}

export interface ServerInstance {
  id: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped';
  region: string;
  capacity: number;
  cost: number;
  launchedAt: Date;
}

export interface ScalingDecision {
  timestamp: Date;
  currentServers: number;
  targetServers: number;
  reason: string;
  predictedLoad: number;
  currentLoad: number;
  costImpact: number;
  approved: boolean;
}

export interface TrafficPrediction {
  timestamp: Date;
  predictedRequestRate: number;
  confidence: number;
  historicalData: number[];
  trend: number;
}

export interface CostAnalysis {
  hourlyRate: number;
  projectedDailyCost: number;
  potentialSavings: number;
  efficiencyScore: number;
}

export interface AutoScalerConfig {
  minServers: number;
  maxServers: number;
  targetUtilization: number;
  serverCapacity: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number;
  costPerServerHour: number;
  maxDailyBudget: number;
}
