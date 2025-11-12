import { QueueMetrics, QueuePrediction, ScalingRecommendation } from '../types';
import { QueuingTheoryModel } from '../models/QueuingTheory';

/**
 * Capacity Planner using queuing theory for predictions and scaling decisions
 */
export class CapacityPlanner {
  private readonly UTILIZATION_WARNING = 0.7;
  private readonly UTILIZATION_CRITICAL = 0.85;
  private readonly PREDICTION_HORIZON = 300; // 5 minutes ahead
  private readonly SCALE_UP_COOLDOWN = 60; // seconds
  private lastScaleTime: Map<string, number> = new Map();

  /**
   * Generate prediction for queue based on current metrics
   */
  predictQueueBehavior(
    queueName: string,
    metrics: QueueMetrics,
    currentServers: number,
    arrivalRateTrend: number = 0
  ): QueuePrediction {
    // Predict future state
    const future = QueuingTheoryModel.predictFutureMetrics(
      metrics.arrivalRate,
      arrivalRateTrend,
      metrics.serviceRate,
      this.PREDICTION_HORIZON
    );

    // Calculate time to threshold breach
    const timeToWarning = QueuingTheoryModel.calculateTimeToThreshold(
      metrics.utilization,
      arrivalRateTrend / metrics.serviceRate, // utilization trend
      this.UTILIZATION_WARNING
    );

    const timeToCritical = QueuingTheoryModel.calculateTimeToThreshold(
      metrics.utilization,
      arrivalRateTrend / metrics.serviceRate,
      this.UTILIZATION_CRITICAL
    );

    // Generate scaling recommendation
    const scalingRecommendation = this.generateScalingRecommendation(
      queueName,
      metrics,
      future.utilization,
      currentServers,
      Math.min(timeToWarning, timeToCritical)
    );

    return {
      predictedUtilization: future.utilization,
      predictedWaitTime: future.waitTime,
      predictedQueueLength: future.queueLength,
      scalingRecommendation,
      timeToThreshold: Math.min(timeToWarning, timeToCritical)
    };
  }

  /**
   * Generate scaling recommendation based on predictions
   */
  private generateScalingRecommendation(
    queueName: string,
    currentMetrics: QueueMetrics,
    predictedUtilization: number,
    currentServers: number,
    timeToThreshold: number
  ): ScalingRecommendation {
    const now = Date.now() / 1000;
    const lastScale = this.lastScaleTime.get(queueName) || 0;
    const timeSinceLastScale = now - lastScale;

    // Check cooldown
    if (timeSinceLastScale < this.SCALE_UP_COOLDOWN) {
      return {
        action: 'none',
        targetServers: currentServers,
        currentServers,
        reason: 'Cooling down from recent scaling',
        confidence: 1.0
      };
    }

    // Determine if scaling needed
    if (predictedUtilization > this.UTILIZATION_CRITICAL || 
        currentMetrics.utilization > this.UTILIZATION_WARNING) {
      
      // Calculate optimal servers
      const serviceRatePerServer = currentMetrics.serviceRate / currentServers;
      const targetServers = QueuingTheoryModel.calculateOptimalServers(
        currentMetrics.arrivalRate,
        serviceRatePerServer,
        0.65 // Target 65% utilization
      );

      if (targetServers > currentServers) {
        this.lastScaleTime.set(queueName, now);
        
        return {
          action: 'scale_up',
          targetServers,
          currentServers,
          reason: `Utilization at ${(currentMetrics.utilization * 100).toFixed(1)}%, predicted ${(predictedUtilization * 100).toFixed(1)}%`,
          confidence: timeToThreshold < 60 ? 0.95 : 0.75
        };
      }
    }

    // Check if we can scale down
    if (predictedUtilization < 0.5 && currentMetrics.utilization < 0.5 && currentServers > 1) {
      const targetServers = Math.max(
        1,
        Math.floor(currentServers * (predictedUtilization / 0.6))
      );

      if (targetServers < currentServers) {
        this.lastScaleTime.set(queueName, now);

        return {
          action: 'scale_down',
          targetServers,
          currentServers,
          reason: `Low utilization: ${(currentMetrics.utilization * 100).toFixed(1)}%`,
          confidence: 0.8
        };
      }
    }

    return {
      action: 'none',
      targetServers: currentServers,
      currentServers,
      reason: 'System operating within optimal range',
      confidence: 1.0
    };
  }

  /**
   * Calculate system-wide capacity metrics
   */
  calculateSystemCapacity(allMetrics: QueueMetrics[]): {
    bottleneck: string | null;
    totalThroughput: number;
    systemUtilization: number;
  } {
    if (allMetrics.length === 0) {
      return { bottleneck: null, totalThroughput: 0, systemUtilization: 0 };
    }

    // Find bottleneck (highest utilization)
    let maxUtilization = 0;
    let bottleneckIndex = 0;

    allMetrics.forEach((metrics, index) => {
      if (metrics.utilization > maxUtilization) {
        maxUtilization = metrics.utilization;
        bottleneckIndex = index;
      }
    });

    // System throughput limited by bottleneck
    const bottleneckMetrics = allMetrics[bottleneckIndex];
    const totalThroughput = bottleneckMetrics.serviceRate * (1 - bottleneckMetrics.utilization);

    // Average system utilization
    const avgUtilization = allMetrics.reduce((sum, m) => sum + m.utilization, 0) / allMetrics.length;

    return {
      bottleneck: `Queue ${bottleneckIndex}`,
      totalThroughput,
      systemUtilization: avgUtilization
    };
  }
}
