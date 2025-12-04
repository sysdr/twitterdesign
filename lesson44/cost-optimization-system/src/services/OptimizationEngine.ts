import { OptimizationRecommendation, ScalingDecision } from '../types';
import { ResourceMonitor } from './ResourceMonitor';
import { CostTracker } from './CostTracker';

export class OptimizationEngine {
  private resourceMonitor: ResourceMonitor;
  private costTracker: CostTracker;
  private budgetLimit: number;
  private readonly LATENCY_THRESHOLD = 200; // ms
  private readonly CPU_SCALE_DOWN_THRESHOLD = 40; // %
  private readonly CPU_SCALE_UP_THRESHOLD = 75; // %

  constructor(
    resourceMonitor: ResourceMonitor,
    costTracker: CostTracker,
    budgetLimit: number = 100 // $100 per day
  ) {
    this.resourceMonitor = resourceMonitor;
    this.costTracker = costTracker;
    this.budgetLimit = budgetLimit;
  }

  analyzeAndOptimize(): ScalingDecision {
    const avgCpu = this.resourceMonitor.getAverageUtilization(10);
    const avgLatency = this.resourceMonitor.getAverageLatency(10);
    const projectedCost = this.costTracker.getProjectedDailyCost();
    const currentInstances = this.resourceMonitor.getInstanceCount();

    // Check if we need to scale up for performance
    if (avgLatency > this.LATENCY_THRESHOLD && avgCpu > this.CPU_SCALE_UP_THRESHOLD) {
      if (projectedCost < this.budgetLimit * 0.9) {
        return {
          action: 'scale_up',
          reason: `High latency (${avgLatency.toFixed(0)}ms) and CPU (${avgCpu.toFixed(0)}%)`,
          timestamp: new Date(),
          costImpact: 20,
          performanceImpact: 'Improved latency by ~30%'
        };
      } else {
        return {
          action: 'optimize',
          reason: 'Performance degraded but budget constrained',
          timestamp: new Date(),
          costImpact: 0,
          performanceImpact: 'Enable aggressive caching'
        };
      }
    }

    // Check if we can scale down to save costs
    if (avgCpu < this.CPU_SCALE_DOWN_THRESHOLD && currentInstances > 1) {
      if (avgLatency < this.LATENCY_THRESHOLD * 0.7) {
        return {
          action: 'scale_down',
          reason: `Low CPU utilization (${avgCpu.toFixed(0)}%), latency acceptable`,
          timestamp: new Date(),
          costImpact: -30,
          performanceImpact: 'Minimal impact expected'
        };
      }
    }

    // Check budget constraints
    if (projectedCost > this.budgetLimit * 0.95) {
      return {
        action: 'optimize',
        reason: 'Approaching budget limit',
        timestamp: new Date(),
        costImpact: -15,
        performanceImpact: 'Implement cost-saving measures'
      };
    }

    return {
      action: 'no_action',
      reason: 'System operating optimally',
      timestamp: new Date(),
      costImpact: 0,
      performanceImpact: 'Stable'
    };
  }

  generateRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const costBreakdown = this.costTracker.getCostBreakdown();
    const avgCpu = this.resourceMonitor.getAverageUtilization(60);

    // Database optimization
    if (costBreakdown.database > costBreakdown.compute * 0.3) {
      recommendations.push({
        id: 'db-cache',
        type: 'caching',
        description: 'Implement aggressive database query caching',
        estimatedSavings: 45,
        impact: 'high',
        confidence: 0.85
      });
    }

    // Instance right-sizing
    if (avgCpu < 30) {
      recommendations.push({
        id: 'instance-downsize',
        type: 'instance_type',
        description: 'Switch to smaller instance type (t3.small)',
        estimatedSavings: 50,
        impact: 'medium',
        confidence: 0.90
      });
    }

    // Reserved instances
    recommendations.push({
      id: 'reserved-instances',
      type: 'instance_type',
      description: 'Convert to reserved instances for stable workload',
      estimatedSavings: 40,
      impact: 'low',
      confidence: 0.95
    });

    // Network optimization
    if (costBreakdown.network > 10) {
      recommendations.push({
        id: 'cdn-images',
        type: 'caching',
        description: 'Move images to CDN to reduce egress costs',
        estimatedSavings: 30,
        impact: 'medium',
        confidence: 0.80
      });
    }

    return recommendations.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
  }

  setBudgetLimit(limit: number): void {
    this.budgetLimit = limit;
  }
}
