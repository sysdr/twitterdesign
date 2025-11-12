import { QueueMetrics } from '../types';

/**
 * Collects real-time queue metrics using exponential weighted moving averages
 */
export class MetricsCollector {
  private arrivalCounts: Map<string, number[]> = new Map();
  private serviceCounts: Map<string, number[]> = new Map();
  private queueDepths: Map<string, number[]> = new Map();
  private readonly windowSize: number = 10; // seconds
  private readonly alpha: number = 0.3; // EWMA smoothing factor

  /**
   * Record new arrival to queue
   */
  recordArrival(queueName: string): void {
    const now = Date.now();
    const arrivals = this.arrivalCounts.get(queueName) || [];
    arrivals.push(now);
    
    // Keep only recent arrivals within window
    const cutoff = now - (this.windowSize * 1000);
    const recentArrivals = arrivals.filter(t => t > cutoff);
    this.arrivalCounts.set(queueName, recentArrivals);
  }

  /**
   * Record service completion
   */
  recordServiceCompletion(queueName: string): void {
    const now = Date.now();
    const completions = this.serviceCounts.get(queueName) || [];
    completions.push(now);
    
    const cutoff = now - (this.windowSize * 1000);
    const recentCompletions = completions.filter(t => t > cutoff);
    this.serviceCounts.set(queueName, recentCompletions);
  }

  /**
   * Record current queue depth
   */
  recordQueueDepth(queueName: string, depth: number): void {
    const depths = this.queueDepths.get(queueName) || [];
    depths.push(depth);
    
    // Keep last N measurements
    if (depths.length > 100) {
      depths.shift();
    }
    this.queueDepths.set(queueName, depths);
  }

  /**
   * Calculate current metrics for queue
   */
  getMetrics(queueName: string): QueueMetrics {
    const arrivals = this.arrivalCounts.get(queueName) || [];
    const completions = this.serviceCounts.get(queueName) || [];
    const depths = this.queueDepths.get(queueName) || [0];

    // Calculate rates
    const arrivalRate = arrivals.length / this.windowSize;
    const serviceRate = completions.length / this.windowSize;
    
    // Average queue depth with EWMA
    const avgDepth = this.calculateEWMA(depths);
    
    // Calculate wait time using Little's Law if we have arrivals
    const averageWaitTime = arrivalRate > 0 ? avgDepth / arrivalRate : 0;
    
    const utilization = serviceRate > 0 ? 
      Math.min(arrivalRate / serviceRate, 0.999) : 0;

    return {
      arrivalRate,
      serviceRate,
      queueLength: avgDepth,
      utilization,
      averageWaitTime,
      timestamp: Date.now()
    };
  }

  /**
   * Calculate Exponential Weighted Moving Average
   */
  private calculateEWMA(values: number[]): number {
    if (values.length === 0) return 0;
    
    let ewma = values[0];
    for (let i = 1; i < values.length; i++) {
      ewma = this.alpha * values[i] + (1 - this.alpha) * ewma;
    }
    return ewma;
  }

  /**
   * Calculate trend (rate of change)
   */
  calculateTrend(queueName: string, metric: 'arrival' | 'utilization'): number {
    if (metric === 'arrival') {
      const arrivals = this.arrivalCounts.get(queueName) || [];
      if (arrivals.length < 4) return 0;

      const midpoint = Math.floor(arrivals.length / 2);
      const firstWindow = arrivals.slice(0, midpoint);
      const secondWindow = arrivals.slice(-midpoint);

      const getDurationSeconds = (window: number[]): number => {
        const durationMs = window[window.length - 1] - window[0];
        return durationMs > 0 ? durationMs / 1000 : this.windowSize;
      };

      const firstRate = firstWindow.length / getDurationSeconds(firstWindow);
      const secondRate = secondWindow.length / getDurationSeconds(secondWindow);

      return secondRate - firstRate;
    }

    const depths = this.queueDepths.get(queueName) || [];
    if (depths.length < 4) return 0;

    const midpoint = Math.floor(depths.length / 2);
    const firstWindow = depths.slice(0, midpoint);
    const secondWindow = depths.slice(-midpoint);

    const average = (window: number[]): number =>
      window.reduce((sum, value) => sum + value, 0) / window.length;

    return average(secondWindow) - average(firstWindow);
  }

  /**
   * Reset metrics for a queue
   */
  reset(queueName: string): void {
    this.arrivalCounts.delete(queueName);
    this.serviceCounts.delete(queueName);
    this.queueDepths.delete(queueName);
  }

  /**
   * Clear all metrics
   */
  resetAll(): void {
    this.arrivalCounts.clear();
    this.serviceCounts.clear();
    this.queueDepths.clear();
  }
}
