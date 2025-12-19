import { StatsD } from 'node-statsd';

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  type: 'gauge' | 'counter' | 'timing' | 'histogram';
}

export class MetricsCollector {
  private statsd: StatsD;
  private metrics: Metric[] = [];
  private aggregationWindow = 10000; // 10 seconds

  constructor(host: string = 'localhost', port: number = 8125) {
    this.statsd = new StatsD({ host, port });
    this.startAggregation();
  }

  recordTiming(name: string, duration: number, tags?: Record<string, string>): void {
    this.statsd.timing(name, duration);
    this.metrics.push({
      name,
      value: duration,
      timestamp: Date.now(),
      tags,
      type: 'timing'
    });
  }

  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.statsd.gauge(name, value);
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags,
      type: 'gauge'
    });
  }

  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.statsd.increment(name, value);
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags,
      type: 'counter'
    });
  }

  private startAggregation(): void {
    setInterval(() => {
      this.aggregateMetrics();
    }, this.aggregationWindow);
  }

  private aggregateMetrics(): void {
    const now = Date.now();
    const windowMetrics = this.metrics.filter(
      m => now - m.timestamp < this.aggregationWindow
    );

    // Group by metric name
    const grouped = new Map<string, Metric[]>();
    windowMetrics.forEach(metric => {
      if (!grouped.has(metric.name)) {
        grouped.set(metric.name, []);
      }
      grouped.get(metric.name)!.push(metric);
    });

    // Calculate percentiles for each metric
    grouped.forEach((metrics, name) => {
      if (metrics[0].type === 'timing' || metrics[0].type === 'histogram') {
        const percentiles = this.calculatePercentiles(metrics.map(m => m.value));
        console.log(`${name} - P50: ${percentiles.p50}ms, P95: ${percentiles.p95}ms, P99: ${percentiles.p99}ms`);
      }
    });

    // Clean old metrics
    this.metrics = this.metrics.filter(m => now - m.timestamp < 60000);
  }

  calculatePercentiles(values: number[]): { p50: number; p95: number; p99: number; p999: number } {
    const sorted = [...values].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      p50: sorted[Math.floor(len * 0.50)] || 0,
      p95: sorted[Math.floor(len * 0.95)] || 0,
      p99: sorted[Math.floor(len * 0.99)] || 0,
      p999: sorted[Math.floor(len * 0.999)] || 0
    };
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  getRecentMetrics(windowMs: number = 60000): Metric[] {
    const now = Date.now();
    return this.metrics.filter(m => now - m.timestamp < windowMs);
  }
}
