import { PricingModel } from '../models/pricing';
import { CostMetrics } from '../types';

export class CostTracker {
  private metrics: CostMetrics[] = [];
  private currentPeriodCost: number = 0;
  private instanceType: string;

  constructor(instanceType: string = 't3.medium') {
    this.instanceType = instanceType;
  }

  trackRequest(
    duration: number,
    dbReads: number,
    dbWrites: number,
    cacheOps: number,
    responseSize: number
  ): CostMetrics {
    const computeCost = (duration / 3600) * PricingModel.getInstanceHourlyCost(this.instanceType);
    const databaseCost = (dbReads * PricingModel.DB_COSTS.readQuery) + 
                         (dbWrites * PricingModel.DB_COSTS.writeQuery);
    const cacheCost = cacheOps * PricingModel.CACHE_COSTS.operationCost;
    const networkCost = (responseSize / (1024 * 1024 * 1024)) * PricingModel.NETWORK_COSTS.egressGB;

    const totalCost = computeCost + databaseCost + cacheCost + networkCost;
    this.currentPeriodCost += totalCost;

    const metric: CostMetrics = {
      timestamp: new Date(),
      computeCost,
      databaseCost,
      cacheCost,
      networkCost,
      totalCost
    };

    this.metrics.push(metric);
    
    // Keep only last hour of data
    const oneHourAgo = Date.now() - 3600000;
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > oneHourAgo);

    return metric;
  }

  getCurrentHourCost(): number {
    return this.metrics.reduce((sum, m) => sum + m.totalCost, 0);
  }

  getProjectedDailyCost(): number {
    const hourlyAvg = this.getCurrentHourCost();
    return hourlyAvg * 24;
  }

  getCostBreakdown(): { compute: number; database: number; cache: number; network: number } {
    const recent = this.metrics.slice(-100); // Last 100 requests
    return {
      compute: recent.reduce((sum, m) => sum + m.computeCost, 0),
      database: recent.reduce((sum, m) => sum + m.databaseCost, 0),
      cache: recent.reduce((sum, m) => sum + m.cacheCost, 0),
      network: recent.reduce((sum, m) => sum + m.networkCost, 0)
    };
  }

  reset(): void {
    this.metrics = [];
    this.currentPeriodCost = 0;
  }
}
