import { v4 as uuidv4 } from 'uuid';
import { OptimizationRecommendation } from '../../models/CostModels';
import { AllocationEngine } from '../allocation/AllocationEngine';
import { logger } from '../../utils/logger';

export class OptimizationEngine {
  private interval: NodeJS.Timeout | null = null;
  private allocationEngine: AllocationEngine | null = null;
  private recommendations: OptimizationRecommendation[] = [];
  private isRunning = false;

  start(allocationEngine: AllocationEngine): void {
    if (this.isRunning) return;

    this.allocationEngine = allocationEngine;
    this.isRunning = true;
    
    const intervalMs = parseInt(process.env.OPTIMIZATION_SCAN_INTERVAL || '3600000');
    
    this.interval = setInterval(() => {
      this.generateRecommendations();
    }, intervalMs);

    // Generate initial recommendations
    setTimeout(() => this.generateRecommendations(), 5000);

    logger.info('OptimizationEngine started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('OptimizationEngine stopped');
  }

  private generateRecommendations(): void {
    if (!this.allocationEngine) return;

    const byTeam = this.allocationEngine.getCostsByTeam();
    const byFeature = this.allocationEngine.getCostsByFeature();

    // Clear old recommendations in 'identified' state
    this.recommendations = this.recommendations.filter(r => r.status !== 'identified');

    // Generate different types of recommendations
    this.generateRightSizingRecommendations(byTeam);
    this.generateReservedCapacityRecommendations(byTeam);
    this.generateWasteReductionRecommendations();
    this.generateArchitecturalRecommendations(byFeature);

    logger.info(`Generated ${this.recommendations.length} optimization recommendations`);
  }

  private generateRightSizingRecommendations(costsByTeam: Map<string, number>): void {
    const services = ['database-primary', 'cache-redis'];
    
    services.forEach(serviceId => {
      const currentCost = this.estimateServiceCost(serviceId);
      const savingsPercent = 0.20 + Math.random() * 0.15; // 20-35% savings
      const projectedCost = currentCost * (1 - savingsPercent);

      this.recommendations.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: 'rightsizing',
        serviceId,
        title: `Right-size ${serviceId} instances`,
        description: `Analysis shows ${serviceId} running at ${Math.floor(15 + Math.random() * 20)}% average utilization. Recommend downsizing to smaller instance type.`,
        currentCost: parseFloat(currentCost.toFixed(2)),
        projectedCost: parseFloat(projectedCost.toFixed(2)),
        savingsAmount: parseFloat((currentCost - projectedCost).toFixed(2)),
        savingsPercentage: parseFloat((savingsPercent * 100).toFixed(1)),
        confidence: 0.85 + Math.random() * 0.1,
        implementationEffort: 'low',
        status: 'identified'
      });
    });
  }

  private generateReservedCapacityRecommendations(costsByTeam: Map<string, number>): void {
    const totalCost = Array.from(costsByTeam.values()).reduce((sum, cost) => sum + cost, 0);
    const monthlyCost = totalCost * 30 * 24; // Convert hourly to monthly
    const savingsPercent = 0.40; // 40% savings with 3-year commitment

    this.recommendations.push({
      id: uuidv4(),
      timestamp: new Date(),
      type: 'reserved_capacity',
      serviceId: 'all-services',
      title: 'Purchase reserved capacity for stable workloads',
      description: 'Commit to 3-year reserved instances for predictable baseline capacity. Current on-demand spending shows stable pattern suitable for reservations.',
      currentCost: parseFloat((monthlyCost * 36).toFixed(2)), // 3-year total
      projectedCost: parseFloat((monthlyCost * 36 * (1 - savingsPercent)).toFixed(2)),
      savingsAmount: parseFloat((monthlyCost * 36 * savingsPercent).toFixed(2)),
      savingsPercentage: 40,
      confidence: 0.95,
      implementationEffort: 'medium',
      status: 'identified'
    });
  }

  private generateWasteReductionRecommendations(): void {
    const wasteSources = [
      {
        serviceId: 'staging-environment',
        title: 'Shutdown staging environment during off-hours',
        description: 'Staging environment runs 24/7 but only used during business hours (9 AM - 6 PM weekdays). Automate shutdown to save 70% of costs.',
        monthlySaving: 4100
      },
      {
        serviceId: 'old-snapshots',
        title: 'Delete outdated database snapshots',
        description: 'Found 47 database snapshots older than 90 days. Retention policy only requires 30 days. Delete old snapshots.',
        monthlySaving: 890
      }
    ];

    wasteSources.forEach(waste => {
      this.recommendations.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: 'waste_reduction',
        serviceId: waste.serviceId,
        title: waste.title,
        description: waste.description,
        currentCost: waste.monthlySaving,
        projectedCost: 0,
        savingsAmount: waste.monthlySaving,
        savingsPercentage: 100,
        confidence: 0.99,
        implementationEffort: 'low',
        status: 'identified'
      });
    });
  }

  private generateArchitecturalRecommendations(costsByFeature: Map<string, number>): void {
    const timelineCost = costsByFeature.get('timeline-generation') || 0;
    
    if (timelineCost > 100) { // Only recommend if significant cost
      const savingsPercent = 0.30;
      const savingsAmount = timelineCost * savingsPercent;

      this.recommendations.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: 'architectural',
        serviceId: 'timeline-service',
        title: 'Implement materialized timeline caching',
        description: 'Timeline generation accounts for significant database load. Implement Redis-based materialized timeline cache to reduce database queries by 70%.',
        currentCost: parseFloat((timelineCost * 30 * 24).toFixed(2)), // Monthly
        projectedCost: parseFloat((timelineCost * 30 * 24 * (1 - savingsPercent)).toFixed(2)),
        savingsAmount: parseFloat((savingsAmount * 30 * 24).toFixed(2)),
        savingsPercentage: parseFloat((savingsPercent * 100).toFixed(1)),
        confidence: 0.78,
        implementationEffort: 'high',
        status: 'identified'
      });
    }
  }

  private estimateServiceCost(serviceId: string): number {
    // Estimate current hourly cost for a service
    const baseCosts: Record<string, number> = {
      'database-primary': 15.5,
      'cache-redis': 8.2,
      'api-gateway': 5.1,
      'tweet-service': 6.8,
      'timeline-service': 7.3,
      'media-storage': 12.4
    };
    return baseCosts[serviceId] || 5.0;
  }

  getRecommendations(): OptimizationRecommendation[] {
    return this.recommendations.sort((a, b) => b.savingsAmount - a.savingsAmount);
  }

  getTotalSavingsOpportunity(): number {
    return this.recommendations
      .filter(r => r.status === 'identified')
      .reduce((sum, r) => sum + r.savingsAmount, 0);
  }

  isHealthy(): boolean {
    return this.isRunning;
  }
}
