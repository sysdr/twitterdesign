import { v4 as uuidv4 } from 'uuid';
import { AllocationData } from '../../models/CostModels';
import { CostCalculator } from '../calculator/CostCalculator';
import { logger } from '../../utils/logger';

export class AllocationEngine {
  private interval: NodeJS.Timeout | null = null;
  private costCalculator: CostCalculator | null = null;
  private allocations: AllocationData[] = [];
  private isRunning = false;
  private teamMapping: Map<string, string> = new Map();

  constructor() {
    this.initializeTeamMapping();
  }

  private initializeTeamMapping(): void {
    // Map services to teams
    this.teamMapping.set('api-gateway', 'platform-team');
    this.teamMapping.set('tweet-service', 'content-team');
    this.teamMapping.set('timeline-service', 'content-team');
    this.teamMapping.set('media-storage', 'media-team');
    this.teamMapping.set('database-primary', 'platform-team');
    this.teamMapping.set('cache-redis', 'platform-team');
  }

  start(costCalculator: CostCalculator): void {
    if (this.isRunning) return;

    this.costCalculator = costCalculator;
    this.isRunning = true;
    
    const intervalMs = parseInt(process.env.COST_CALCULATION_INTERVAL || '10000');
    
    this.interval = setInterval(() => {
      this.allocateCosts();
    }, intervalMs);

    logger.info('AllocationEngine started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('AllocationEngine stopped');
  }

  private allocateCosts(): void {
    if (!this.costCalculator) return;

    const recentCosts = this.costCalculator.getRecentCosts(1);
    
    recentCosts.forEach(cost => {
      const allocation: AllocationData = {
        id: uuidv4(),
        timestamp: cost.timestamp,
        costId: cost.id,
        allocations: this.calculateAllocation(cost)
      };

      this.allocations.push(allocation);
    });

    // Keep only last 24 hours
    const oneDayAgo = new Date(Date.now() - 86400000);
    this.allocations = this.allocations.filter(a => a.timestamp > oneDayAgo);

    logger.debug(`Allocated ${recentCosts.length} cost records`);
  }

  private calculateAllocation(cost: any): AllocationData['allocations'] {
    const teamId = this.teamMapping.get(cost.serviceId) || 'unallocated';
    
    // In a real system, this would use distributed tracing to attribute costs
    // For demo, we do simple direct allocation
    return [{
      serviceId: cost.serviceId,
      teamId,
      featureId: this.mapToFeature(cost.serviceId),
      percentage: 100,
      cost: cost.cost
    }];
  }

  private mapToFeature(serviceId: string): string {
    if (serviceId.includes('tweet')) return 'tweet-posting';
    if (serviceId.includes('timeline')) return 'timeline-generation';
    if (serviceId.includes('media')) return 'media-hosting';
    return 'infrastructure';
  }

  getCostsByTeam(): Map<string, number> {
    const byTeam = new Map<string, number>();
    
    this.allocations.forEach(allocation => {
      allocation.allocations.forEach(alloc => {
        const current = byTeam.get(alloc.teamId) || 0;
        byTeam.set(alloc.teamId, current + alloc.cost);
      });
    });

    return byTeam;
  }

  getCostsByFeature(): Map<string, number> {
    const byFeature = new Map<string, number>();
    
    this.allocations.forEach(allocation => {
      allocation.allocations.forEach(alloc => {
        if (alloc.featureId) {
          const current = byFeature.get(alloc.featureId) || 0;
          byFeature.set(alloc.featureId, current + alloc.cost);
        }
      });
    });

    return byFeature;
  }

  isHealthy(): boolean {
    return this.isRunning && this.allocations.length > 0;
  }
}
