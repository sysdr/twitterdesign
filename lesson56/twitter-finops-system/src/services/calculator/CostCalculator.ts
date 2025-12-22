import { v4 as uuidv4 } from 'uuid';
import { CostData, PricingModel } from '../../models/CostModels';
import { MeteringService } from '../metering/MeteringService';
import { logger } from '../../utils/logger';

export class CostCalculator {
  private interval: NodeJS.Timeout | null = null;
  private meteringService: MeteringService | null = null;
  private costData: CostData[] = [];
  private isRunning = false;
  private pricingModel: PricingModel;

  constructor() {
    // Simplified pricing model based on typical cloud provider rates
    this.pricingModel = {
      resourceType: 'standard',
      region: 'us-east-1',
      rates: {
        compute: {
          perCPUHour: 0.05,
          perGBMemoryHour: 0.01
        },
        storage: {
          perGBMonth: 0.023,
          perGBTransfer: 0.09
        },
        network: {
          perGBEgress: 0.09,
          perGBCDN: 0.085
        },
        database: {
          perCPUHour: 0.08,
          perGBStorage: 0.10,
          perIOPS: 0.0001
        }
      }
    };
  }

  start(meteringService: MeteringService): void {
    if (this.isRunning) return;

    this.meteringService = meteringService;
    this.isRunning = true;
    
    const intervalMs = parseInt(process.env.COST_CALCULATION_INTERVAL || '10000');
    
    this.interval = setInterval(() => {
      this.calculateCosts();
    }, intervalMs);

    logger.info('CostCalculator started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('CostCalculator stopped');
  }

  private calculateCosts(): void {
    if (!this.meteringService) return;

    const recentUsage = this.meteringService.getRecentUsage(1);
    
    recentUsage.forEach(usage => {
      const cost = this.calculateResourceCost(usage);
      this.costData.push(cost);
    });

    // Keep only last 24 hours
    const oneDayAgo = new Date(Date.now() - 86400000);
    this.costData = this.costData.filter(c => c.timestamp > oneDayAgo);

    logger.debug(`Calculated costs for ${recentUsage.length} usage records`);
  }

  private calculateResourceCost(usage: any): CostData {
    const metrics = usage.metrics;
    const rates = this.pricingModel.rates;
    
    let computeCost = 0;
    let storageCost = 0;
    let networkCost = 0;

    // Calculate compute costs
    if (metrics.cpuMilliseconds) {
      const cpuHours = metrics.cpuMilliseconds / 1000 / 3600;
      computeCost += cpuHours * rates.compute.perCPUHour;
    }
    if (metrics.memoryMBSeconds) {
      const memoryGBHours = (metrics.memoryMBSeconds / 1024) / 3600;
      computeCost += memoryGBHours * rates.compute.perGBMemoryHour;
    }

    // Calculate storage costs
    if (metrics.storageGBHours) {
      storageCost += metrics.storageGBHours * (rates.storage.perGBMonth / 720);
    }

    // Calculate network costs
    if (metrics.networkGB) {
      networkCost += metrics.networkGB * rates.network.perGBEgress;
    }

    // Database specific costs
    if (usage.resourceType === 'database') {
      if (metrics.databaseQueries) {
        computeCost += metrics.databaseQueries * rates.database.perIOPS;
      }
    }

    const totalCost = computeCost + storageCost + networkCost;

    return {
      id: uuidv4(),
      timestamp: usage.timestamp,
      serviceId: usage.serviceId,
      resourceType: usage.resourceType,
      cost: parseFloat(totalCost.toFixed(6)),
      currency: 'USD',
      breakdown: {
        compute: parseFloat(computeCost.toFixed(6)),
        storage: parseFloat(storageCost.toFixed(6)),
        network: parseFloat(networkCost.toFixed(6)),
        other: 0
      }
    };
  }

  getRecentCosts(minutes: number = 60): CostData[] {
    const cutoff = new Date(Date.now() - minutes * 60000);
    return this.costData.filter(c => c.timestamp > cutoff);
  }

  getTotalCost(minutes: number = 60): number {
    const costs = this.getRecentCosts(minutes);
    return costs.reduce((sum, c) => sum + c.cost, 0);
  }

  getCostsByService(): Map<string, number> {
    const costs = this.getRecentCosts(60);
    const byService = new Map<string, number>();
    
    costs.forEach(cost => {
      const current = byService.get(cost.serviceId) || 0;
      byService.set(cost.serviceId, current + cost.cost);
    });

    return byService;
  }

  isHealthy(): boolean {
    return this.isRunning && this.costData.length > 0;
  }
}
