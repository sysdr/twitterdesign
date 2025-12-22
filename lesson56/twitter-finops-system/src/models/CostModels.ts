export interface ResourceUsage {
  id: string;
  serviceId: string;
  resourceType: 'compute' | 'storage' | 'network' | 'database' | 'cache';
  timestamp: Date;
  metrics: {
    cpuMilliseconds?: number;
    memoryMBSeconds?: number;
    storageGBHours?: number;
    networkGB?: number;
    apiCalls?: number;
    databaseQueries?: number;
    cacheOperations?: number;
  };
}

export interface CostData {
  id: string;
  timestamp: Date;
  serviceId: string;
  resourceType: string;
  cost: number;
  currency: 'USD';
  breakdown: {
    compute?: number;
    storage?: number;
    network?: number;
    other?: number;
  };
}

export interface AllocationData {
  id: string;
  timestamp: Date;
  costId: string;
  allocations: {
    serviceId: string;
    teamId: string;
    userId?: string;
    featureId?: string;
    percentage: number;
    cost: number;
  }[];
}

export interface OptimizationRecommendation {
  id: string;
  timestamp: Date;
  type: 'rightsizing' | 'reserved_capacity' | 'waste_reduction' | 'architectural';
  serviceId: string;
  title: string;
  description: string;
  currentCost: number;
  projectedCost: number;
  savingsAmount: number;
  savingsPercentage: number;
  confidence: number;
  implementationEffort: 'low' | 'medium' | 'high';
  status: 'identified' | 'validating' | 'ready' | 'implementing' | 'monitoring' | 'completed';
}

export interface CostAnomaly {
  id: string;
  timestamp: Date;
  serviceId: string;
  anomalyType: 'spike' | 'trend' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentCost: number;
  expectedCost: number;
  deviation: number;
  description: string;
  possibleCauses: string[];
}

export interface Budget {
  id: string;
  name: string;
  monthlyLimit: number;
  currentSpend: number;
  forecastedSpend: number;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical' | 'exceeded';
  alerts: {
    enabled: boolean;
    thresholds: number[];
  };
}

export interface PricingModel {
  resourceType: string;
  region: string;
  rates: {
    compute: {
      perCPUHour: number;
      perGBMemoryHour: number;
    };
    storage: {
      perGBMonth: number;
      perGBTransfer: number;
    };
    network: {
      perGBEgress: number;
      perGBCDN: number;
    };
    database: {
      perCPUHour: number;
      perGBStorage: number;
      perIOPS: number;
    };
  };
}
