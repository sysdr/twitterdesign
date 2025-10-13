import { SystemMetrics } from '../types';

export class MetricsService {
  private metrics: SystemMetrics = {
    queueDepth: 0,
    averageResponseTime: 0,
    throughput: 0,
    errorRate: 0,
    activeUsers: 0
  };

  private responseTimeHistory: number[] = [];
  private throughputHistory: number[] = [];
  private errorHistory: { timestamp: Date; count: number }[] = [];

  updateQueueDepth(depth: number): void {
    this.metrics.queueDepth = depth;
  }

  recordResponseTime(time: number): void {
    this.responseTimeHistory.push(time);
    if (this.responseTimeHistory.length > 100) {
      this.responseTimeHistory.shift();
    }
    
    this.metrics.averageResponseTime = 
      this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length;
  }

  recordThroughput(requests: number): void {
    this.throughputHistory.push(requests);
    if (this.throughputHistory.length > 60) { // Keep last minute
      this.throughputHistory.shift();
    }
    
    this.metrics.throughput = 
      this.throughputHistory.reduce((a, b) => a + b, 0);
  }

  recordError(): void {
    const now = new Date();
    this.errorHistory.push({ timestamp: now, count: 1 });
    
    // Clean old errors (last 5 minutes)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    this.errorHistory = this.errorHistory.filter(e => e.timestamp > fiveMinutesAgo);
    
    const totalRequests = this.throughputHistory.reduce((a, b) => a + b, 0) || 1;
    const totalErrors = this.errorHistory.length;
    this.metrics.errorRate = (totalErrors / totalRequests) * 100;
  }

  updateActiveUsers(count: number): void {
    this.metrics.activeUsers = count;
  }

  getCurrentMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  generateReport(): string {
    return `
System Performance Report
========================
Queue Depth: ${this.metrics.queueDepth}
Avg Response Time: ${this.metrics.averageResponseTime.toFixed(2)}ms
Throughput: ${this.metrics.throughput} req/min
Error Rate: ${this.metrics.errorRate.toFixed(2)}%
Active Users: ${this.metrics.activeUsers}
    `.trim();
  }
}
