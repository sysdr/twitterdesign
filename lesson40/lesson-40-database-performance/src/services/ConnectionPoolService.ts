import { ConnectionPoolConfig, PoolMetrics, OptimizationRecommendation } from '../types';
import {
  littlesLaw,
  calculateUtilization,
  erlangC,
  averageResponseTime,
  percentileLatency,
  optimalPoolSize
} from '../utils/queuingTheory';

export class ConnectionPoolService {
  private config: ConnectionPoolConfig;
  private metricsHistory: PoolMetrics[] = [];
  private latencyHistory: number[] = [];
  private arrivalTimes: number[] = [];
  private serviceTimes: number[] = [];
  
  constructor(config: ConnectionPoolConfig) {
    this.config = config;
  }
  
  // Simulate query execution
  simulateQuery(): { latency: number; queued: boolean } {
    const now = Date.now();
    this.arrivalTimes.push(now);
    
    // Keep only last 1000 samples
    if (this.arrivalTimes.length > 1000) {
      this.arrivalTimes.shift();
    }
    
    // Generate service time (exponential distribution)
    const avgServiceTime = 0.01; // 10ms
    const serviceTime = -avgServiceTime * Math.log(Math.random());
    this.serviceTimes.push(serviceTime);
    
    if (this.serviceTimes.length > 1000) {
      this.serviceTimes.shift();
    }
    
    // Calculate if request would be queued
    const utilization = this.getCurrentUtilization();
    const queueProb = erlangC(this.config.currentConnections, utilization);
    const queued = Math.random() < queueProb;
    
    // Calculate latency
    const waitTime = queued 
      ? -serviceTime * Math.log(Math.random()) * (1 / (1 - utilization))
      : 0;
    const latency = (waitTime + serviceTime) * 1000; // Convert to ms
    
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > 1000) {
      this.latencyHistory.shift();
    }
    
    return { latency, queued };
  }
  
  // Calculate current arrival rate (queries per second)
  getArrivalRate(): number {
    if (this.arrivalTimes.length < 2) return 0;
    
    const windowMs = 1000;
    const now = Date.now();
    const recentArrivals = this.arrivalTimes.filter(t => now - t < windowMs);
    return recentArrivals.length;
  }
  
  // Calculate average service time
  getAverageServiceTime(): number {
    if (this.serviceTimes.length === 0) return 0.01;
    return this.serviceTimes.reduce((a, b) => a + b, 0) / this.serviceTimes.length;
  }
  
  // Calculate current utilization
  getCurrentUtilization(): number {
    const arrivalRate = this.getArrivalRate();
    const serviceTime = this.getAverageServiceTime();
    return calculateUtilization(arrivalRate, serviceTime, this.config.currentConnections);
  }
  
  // Get current metrics
  getMetrics(): PoolMetrics {
    const arrivalRate = this.getArrivalRate();
    const serviceTime = this.getAverageServiceTime();
    const utilization = this.getCurrentUtilization();
    
    // Calculate average connections in use (Little's Law)
    const activeConnections = Math.min(
      littlesLaw(arrivalRate, serviceTime),
      this.config.currentConnections
    );
    
    // Queue probability
    const queueProbability = erlangC(this.config.currentConnections, utilization);
    
    // Response time predictions
    const avgResponse = averageResponseTime(
      this.config.currentConnections,
      arrivalRate,
      serviceTime
    ) * 1000; // Convert to ms
    
    // Calculate variance for percentile estimation
    const variance = 0.5; // Coefficient of variation
    
    const metrics: PoolMetrics = {
      timestamp: Date.now(),
      activeConnections: Math.round(activeConnections),
      waitingRequests: Math.round(queueProbability * arrivalRate),
      arrivalRate,
      serviceTime: serviceTime * 1000, // ms
      utilization,
      p50Latency: percentileLatency(50, avgResponse, variance),
      p95Latency: percentileLatency(95, avgResponse, variance),
      p99Latency: percentileLatency(99, avgResponse, variance),
      queueProbability,
      recommendedPoolSize: optimalPoolSize(arrivalRate, serviceTime)
    };
    
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }
    
    return metrics;
  }
  
  // Get optimization recommendations
  getRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const metrics = this.getMetrics();
    
    // Pool size recommendation
    if (metrics.utilization > 0.8) {
      recommendations.push({
        type: 'pool_size',
        priority: 'high',
        currentValue: this.config.currentConnections,
        recommendedValue: metrics.recommendedPoolSize,
        expectedImprovement: `${Math.round((1 - metrics.utilization / 0.7) * 100)}% latency reduction`,
        reasoning: `Utilization at ${(metrics.utilization * 100).toFixed(1)}% exceeds 70% threshold. Queue probability: ${(metrics.queueProbability * 100).toFixed(1)}%`
      });
    } else if (metrics.utilization < 0.3 && this.config.currentConnections > 5) {
      recommendations.push({
        type: 'pool_size',
        priority: 'medium',
        currentValue: this.config.currentConnections,
        recommendedValue: Math.max(5, metrics.recommendedPoolSize),
        expectedImprovement: `${Math.round((this.config.currentConnections - metrics.recommendedPoolSize) / this.config.currentConnections * 100)}% resource savings`,
        reasoning: `Utilization at ${(metrics.utilization * 100).toFixed(1)}% is below optimal. Connections are idle.`
      });
    }
    
    // Timeout recommendation
    if (metrics.p99Latency > 100) {
      recommendations.push({
        type: 'connection_timeout',
        priority: 'medium',
        currentValue: this.config.acquireTimeout,
        recommendedValue: Math.ceil(metrics.p99Latency * 1.5),
        expectedImprovement: 'Prevent timeout errors',
        reasoning: `P99 latency (${metrics.p99Latency.toFixed(1)}ms) suggests timeout should be ${Math.ceil(metrics.p99Latency * 1.5)}ms`
      });
    }
    
    return recommendations;
  }
  
  // Update pool configuration
  updateConfig(newConfig: Partial<ConnectionPoolConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  // Get historical metrics
  getHistory(): PoolMetrics[] {
    return [...this.metricsHistory];
  }
  
  // Get actual latency history
  getLatencyHistory(): number[] {
    return [...this.latencyHistory];
  }
}
