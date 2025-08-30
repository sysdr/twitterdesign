import { LoadTestMetrics, PerformanceBottleneck } from '../types';

export class PerformanceMonitor {
  private metrics: LoadTestMetrics[] = [];
  private bottlenecks: PerformanceBottleneck[] = [];
  private thresholds = {
    response_time_p95: 200,
    response_time_p99: 500,
    error_rate: 0.01,
    cpu_usage: 0.8,
    memory_usage: 0.85,
    db_connections: 45
  };

  recordMetric(metric: LoadTestMetrics) {
    this.metrics.push(metric);
    this.detectBottlenecks(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private detectBottlenecks(metric: LoadTestMetrics) {
    const newBottlenecks: PerformanceBottleneck[] = [];

    // Check response time
    if (metric.p95_response_time > this.thresholds.response_time_p95) {
      newBottlenecks.push({
        component: 'API Response Time',
        metric: 'P95 Response Time',
        current_value: metric.p95_response_time,
        threshold: this.thresholds.response_time_p95,
        severity: metric.p95_response_time > 400 ? 'critical' : 'high',
        recommendation: 'Optimize database queries or increase server capacity'
      });
    }

    // Check error rate
    if (metric.error_rate > this.thresholds.error_rate) {
      newBottlenecks.push({
        component: 'Error Rate',
        metric: 'Error Percentage',
        current_value: metric.error_rate,
        threshold: this.thresholds.error_rate,
        severity: metric.error_rate > 0.05 ? 'critical' : 'high',
        recommendation: 'Investigate application errors and fix underlying issues'
      });
    }

    // Check database connections
    if (metric.db_connections > this.thresholds.db_connections) {
      newBottlenecks.push({
        component: 'Database',
        metric: 'Connection Pool',
        current_value: metric.db_connections,
        threshold: this.thresholds.db_connections,
        severity: 'medium',
        recommendation: 'Increase database connection pool size or optimize query efficiency'
      });
    }

    this.bottlenecks = newBottlenecks;
  }

  getLatestMetrics(count: number = 50): LoadTestMetrics[] {
    return this.metrics.slice(-count);
  }

  getCurrentBottlenecks(): PerformanceBottleneck[] {
    return this.bottlenecks;
  }

  generateOptimizationReport(): string {
    const latest = this.metrics.slice(-10);
    const avgResponseTime = latest.reduce((sum, m) => sum + m.avg_response_time, 0) / latest.length;
    const avgErrorRate = latest.reduce((sum, m) => sum + m.error_rate, 0) / latest.length;

    return `
Performance Optimization Report:
- Average Response Time: ${avgResponseTime.toFixed(2)}ms
- Average Error Rate: ${(avgErrorRate * 100).toFixed(2)}%
- Active Bottlenecks: ${this.bottlenecks.length}
- Recommendations: ${this.bottlenecks.map(b => b.recommendation).join(', ')}
    `.trim();
  }
}

export const performanceMonitor = new PerformanceMonitor();
