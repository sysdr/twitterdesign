// Predicts system failures using survival analysis

import { SystemMetrics } from '../collectors/MetricsCollector';
import { FailureRateAnalysis, DistributionParams } from '../analyzers/StatisticalAnalyzer';

export interface FailurePrediction {
  probability1Hour: number;
  probability6Hour: number;
  probability24Hour: number;
  timeToFailure: number;  // Estimated hours until failure
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  confidence: number;
}

export class FailurePredictor {
  // Calculate survival probability using fitted distribution
  calculateSurvivalProbability(
    distribution: DistributionParams,
    currentAge: number,
    futureTime: number
  ): number {
    if (distribution.type === 'exponential' && distribution.lambda) {
      // R(t) = e^(-lambda * t)
      const survivalCurrent = Math.exp(-distribution.lambda * currentAge);
      const survivalFuture = Math.exp(-distribution.lambda * (currentAge + futureTime));
      return survivalCurrent > 0 ? survivalFuture / survivalCurrent : 0;
    }
    
    if (distribution.type === 'weibull' && distribution.beta && distribution.eta) {
      // R(t) = e^(-(t/eta)^beta)
      const survivalCurrent = Math.exp(-Math.pow(currentAge / distribution.eta, distribution.beta));
      const survivalFuture = Math.exp(-Math.pow((currentAge + futureTime) / distribution.eta, distribution.beta));
      return survivalCurrent > 0 ? survivalFuture / survivalCurrent : 0;
    }
    
    return 1.0; // Default: assume no failure
  }
  
  // Generate failure prediction
  predict(
    metrics: SystemMetrics[],
    analysis: FailureRateAnalysis
  ): FailurePrediction {
    if (metrics.length === 0) {
      return this.getDefaultPrediction();
    }
    
    // Calculate system age (hours since first metric)
    const firstMetric = metrics[0];
    const lastMetric = metrics[metrics.length - 1];
    const currentAge = (lastMetric.timestamp - firstMetric.timestamp) / 3600000;
    
    // Calculate failure probabilities for different time horizons
    const survival1Hour = this.calculateSurvivalProbability(
      analysis.distribution,
      currentAge,
      1
    );
    const survival6Hour = this.calculateSurvivalProbability(
      analysis.distribution,
      currentAge,
      6
    );
    const survival24Hour = this.calculateSurvivalProbability(
      analysis.distribution,
      currentAge,
      24
    );
    
    const probability1Hour = 1 - survival1Hour;
    const probability6Hour = 1 - survival6Hour;
    const probability24Hour = 1 - survival24Hour;
    
    // Adjust probabilities based on current system state
    const adjustedProb1Hour = this.adjustProbabilityWithCurrentState(
      probability1Hour,
      lastMetric
    );
    
    // Estimate time to failure (when probability reaches 50%)
    const timeToFailure = this.estimateTimeToFailure(
      analysis.distribution,
      currentAge
    );
    
    // Determine risk level
    const riskLevel = this.determineRiskLevel(adjustedProb1Hour, lastMetric);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      riskLevel,
      lastMetric,
      analysis
    );
    
    return {
      probability1Hour: Math.min(0.99, adjustedProb1Hour),
      probability6Hour: Math.min(0.99, probability6Hour),
      probability24Hour: Math.min(0.99, probability24Hour),
      timeToFailure,
      riskLevel,
      recommendations,
      confidence: analysis.confidence
    };
  }
  
  private adjustProbabilityWithCurrentState(
    baseProbability: number,
    metric: SystemMetrics
  ): number {
    let adjustment = 1.0;
    
    // Increase probability if CPU is high
    if (metric.cpuUsage > 90) adjustment *= 2.0;
    else if (metric.cpuUsage > 80) adjustment *= 1.5;
    
    // Increase probability if memory is high
    if (metric.memoryUsage > 90) adjustment *= 2.0;
    else if (metric.memoryUsage > 85) adjustment *= 1.3;
    
    // Increase probability if memory growth rate is positive
    if (metric.memoryGrowthRate > 0.5) adjustment *= 1.5;
    
    // Increase probability if error rate is elevated
    if (metric.errorRate > 0.05) adjustment *= 2.5;
    else if (metric.errorRate > 0.01) adjustment *= 1.5;
    
    // Increase probability if queue is backing up
    if (metric.queueDepth > 50) adjustment *= 1.8;
    
    return Math.min(0.99, baseProbability * adjustment);
  }
  
  private estimateTimeToFailure(
    distribution: DistributionParams,
    currentAge: number
  ): number {
    if (distribution.type === 'exponential' && distribution.lambda) {
      // Median time to failure from current age
      return Math.log(2) / distribution.lambda;
    }
    
    if (distribution.type === 'weibull' && distribution.beta && distribution.eta) {
      // Median additional time to failure
      const t50 = distribution.eta * Math.pow(Math.log(2), 1 / distribution.beta);
      return Math.max(0, t50 - currentAge);
    }
    
    return 24; // Default: 24 hours
  }
  
  private determineRiskLevel(
    probability: number,
    metric: SystemMetrics
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Multi-factor risk assessment
    if (probability > 0.20 || metric.cpuUsage > 95 || metric.errorRate > 0.10) {
      return 'critical';
    }
    if (probability > 0.05 || metric.cpuUsage > 85 || metric.memoryUsage > 90) {
      return 'high';
    }
    if (probability > 0.01 || metric.cpuUsage > 75) {
      return 'medium';
    }
    return 'low';
  }
  
  private generateRecommendations(
    riskLevel: string,
    metric: SystemMetrics,
    analysis: FailureRateAnalysis
  ): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === 'critical') {
      recommendations.push('IMMEDIATE: Initiate graceful shutdown and traffic migration');
      recommendations.push('Activate hot standby instances');
      recommendations.push('Alert on-call team for emergency response');
    }
    
    if (riskLevel === 'high') {
      recommendations.push('Redirect 50% of traffic to healthy instances');
      recommendations.push('Increase monitoring frequency to every 5 seconds');
      recommendations.push('Prepare backup instances for failover');
    }
    
    if (metric.cpuUsage > 80) {
      recommendations.push('Scale out: Add 2 additional compute instances');
    }
    
    if (metric.memoryGrowthRate > 0.3) {
      recommendations.push('Memory leak detected: Schedule service restart in 30 minutes');
    }
    
    if (metric.errorRate > 0.01) {
      recommendations.push('Enable circuit breakers for downstream services');
      recommendations.push('Investigate error logs for root cause');
    }
    
    if (metric.queueDepth > 30) {
      recommendations.push('Enable backpressure: Throttle incoming requests by 30%');
    }
    
    if (analysis.trend === 'increasing') {
      recommendations.push('Failure rate trending up: Review recent deployments');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System healthy: Continue normal monitoring');
    }
    
    return recommendations;
  }
  
  private getDefaultPrediction(): FailurePrediction {
    return {
      probability1Hour: 0.001,
      probability6Hour: 0.005,
      probability24Hour: 0.02,
      timeToFailure: 100,
      riskLevel: 'low',
      recommendations: ['Insufficient data for prediction'],
      confidence: 0
    };
  }
}
