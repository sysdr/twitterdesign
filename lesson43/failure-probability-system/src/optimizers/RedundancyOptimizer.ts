// Optimizes redundancy levels based on failure probabilities

import { FailurePrediction } from '../predictors/FailurePredictor';

export interface RedundancyConfig {
  activeInstances: number;
  standbyInstances: number;
  loadBalancingStrategy: 'round-robin' | 'weighted' | 'least-connections';
  circuitBreakerEnabled: boolean;
  trafficAllocation: { [key: string]: number };
}

export class RedundancyOptimizer {
  private baseInstances: number = 2;
  private maxInstances: number = 10;
  
  // Calculate optimal redundancy based on failure prediction
  optimizeRedundancy(prediction: FailurePrediction): RedundancyConfig {
    const { probability1Hour, riskLevel } = prediction;
    
    // Calculate required redundancy level
    const activeInstances = this.calculateActiveInstances(probability1Hour, riskLevel);
    const standbyInstances = this.calculateStandbyInstances(probability1Hour, riskLevel);
    
    // Choose load balancing strategy
    const loadBalancingStrategy = this.selectLoadBalancingStrategy(riskLevel);
    
    // Enable circuit breaker for high-risk situations
    const circuitBreakerEnabled = riskLevel === 'high' || riskLevel === 'critical';
    
    // Allocate traffic based on risk level
    const trafficAllocation = this.allocateTraffic(
      activeInstances,
      standbyInstances,
      riskLevel
    );
    
    return {
      activeInstances,
      standbyInstances,
      loadBalancingStrategy,
      circuitBreakerEnabled,
      trafficAllocation
    };
  }
  
  private calculateActiveInstances(
    probability: number,
    riskLevel: string
  ): number {
    // Base calculation on failure probability
    let instances = this.baseInstances;
    
    if (probability > 0.20 || riskLevel === 'critical') {
      instances = Math.ceil(this.baseInstances * 2.5);
    } else if (probability > 0.05 || riskLevel === 'high') {
      instances = Math.ceil(this.baseInstances * 1.8);
    } else if (probability > 0.01 || riskLevel === 'medium') {
      instances = Math.ceil(this.baseInstances * 1.3);
    }
    
    return Math.min(this.maxInstances, instances);
  }
  
  private calculateStandbyInstances(
    probability: number,
    riskLevel: string
  ): number {
    // Standby instances for hot failover
    if (probability > 0.15 || riskLevel === 'critical') {
      return 3; // Multiple hot standbys
    } else if (probability > 0.05 || riskLevel === 'high') {
      return 2; // Dual hot standby
    } else if (probability > 0.01) {
      return 1; // Single hot standby
    }
    return 0; // No hot standby needed
  }
  
  private selectLoadBalancingStrategy(
    riskLevel: string
  ): 'round-robin' | 'weighted' | 'least-connections' {
    if (riskLevel === 'critical' || riskLevel === 'high') {
      return 'least-connections'; // Most adaptive
    } else if (riskLevel === 'medium') {
      return 'weighted'; // Balance between fairness and adaptation
    }
    return 'round-robin'; // Simple and efficient
  }
  
  private allocateTraffic(
    activeInstances: number,
    standbyInstances: number,
    riskLevel: string
  ): { [key: string]: number } {
    const allocation: { [key: string]: number } = {};
    
    if (riskLevel === 'critical') {
      // Gradual traffic migration to healthy instances
      for (let i = 0; i < activeInstances; i++) {
        allocation[`instance-${i}`] = 100 / (activeInstances + standbyInstances);
      }
      for (let i = 0; i < standbyInstances; i++) {
        allocation[`standby-${i}`] = 100 / (activeInstances + standbyInstances);
      }
    } else if (riskLevel === 'high') {
      // Reduce load on primary instances
      for (let i = 0; i < activeInstances; i++) {
        allocation[`instance-${i}`] = 70 / activeInstances;
      }
      for (let i = 0; i < standbyInstances; i++) {
        allocation[`standby-${i}`] = 30 / standbyInstances;
      }
    } else {
      // Normal distribution
      for (let i = 0; i < activeInstances; i++) {
        allocation[`instance-${i}`] = 100 / activeInstances;
      }
    }
    
    return allocation;
  }
  
  // Calculate system reliability with current redundancy
  calculateSystemReliability(
    individualReliability: number,
    activeInstances: number,
    architecture: 'series' | 'parallel'
  ): number {
    if (architecture === 'series') {
      // System fails if ANY component fails
      return Math.pow(individualReliability, activeInstances);
    } else {
      // System fails only if ALL components fail
      return 1 - Math.pow(1 - individualReliability, activeInstances);
    }
  }
  
  // Calculate cost-adjusted redundancy (for next lesson preview)
  calculateOptimalRedundancyWithCost(
    failureProbability: number,
    costPerInstance: number,
    failureCost: number
  ): number {
    // Find redundancy level that minimizes total cost
    let minCost = Infinity;
    let optimalInstances = this.baseInstances;
    
    for (let instances = 1; instances <= this.maxInstances; instances++) {
      const reliability = this.calculateSystemReliability(
        1 - failureProbability,
        instances,
        'parallel'
      );
      
      const infrastructureCost = instances * costPerInstance;
      const expectedFailureCost = (1 - reliability) * failureCost;
      const totalCost = infrastructureCost + expectedFailureCost;
      
      if (totalCost < minCost) {
        minCost = totalCost;
        optimalInstances = instances;
      }
    }
    
    return optimalInstances;
  }
}
