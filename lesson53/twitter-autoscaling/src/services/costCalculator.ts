import { CostAnalysis, ServerInstance, AutoScalerConfig } from '../models/types';

export class CostCalculator {
  private config: AutoScalerConfig;

  constructor(config: AutoScalerConfig) {
    this.config = config;
  }

  calculateScalingCost(serverCount: number, durationHours: number): number {
    return serverCount * this.config.costPerServerHour * durationHours;
  }

  estimateRevenueImpact(responseTimeMs: number, requestRate: number): number {
    // Based on Google research: 100ms delay = 1% revenue loss
    const baselineMs = 200;
    const delayMs = Math.max(0, responseTimeMs - baselineMs);
    const revenueLossPercent = (delayMs / 100) * 0.01;
    
    // Estimate hourly revenue based on request rate
    const estimatedHourlyRevenue = (requestRate / 1000) * 10; // $10 per 1000 requests
    
    return estimatedHourlyRevenue * revenueLossPercent;
  }

  isCostEffective(
    scalingCost: number,
    revenueImpact: number,
    confidenceLevel: number
  ): boolean {
    // Adjust threshold based on confidence
    const threshold = 0.5 * confidenceLevel;
    return scalingCost < (revenueImpact * threshold);
  }

  analyzeCurrentCosts(servers: ServerInstance[]): CostAnalysis {
    const runningServers = servers.filter(s => s.status === 'running');
    const hourlyRate = runningServers.reduce((sum, s) => sum + s.cost, 0);
    const projectedDailyCost = hourlyRate * 24;

    // Calculate efficiency: utilization vs cost
    const totalCapacity = runningServers.reduce((sum, s) => sum + s.capacity, 0);
    const efficiencyScore = totalCapacity > 0 ? 
      Math.min(100, (totalCapacity / runningServers.length / 250) * 100) : 0;

    // Estimate potential savings with better optimization
    const potentialSavings = projectedDailyCost * 0.3; // 30% typical optimization

    return {
      hourlyRate,
      projectedDailyCost,
      potentialSavings,
      efficiencyScore
    };
  }

  isWithinBudget(projectedDailyCost: number): boolean {
    return projectedDailyCost <= this.config.maxDailyBudget;
  }
}
