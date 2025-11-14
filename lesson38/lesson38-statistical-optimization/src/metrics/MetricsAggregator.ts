export interface SystemMetrics {
  timestamp: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errorRate: number;
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
  cacheHitRate: number;
}

export class MetricsAggregator {
  private metricsHistory: SystemMetrics[] = [];
  private readonly maxHistorySize = 1440; // 24 hours at 1-minute intervals
  private latencyBuffer: number[] = [];
  private errorCount = 0;
  private requestCount = 0;
  private lastAggregation = Date.now();

  recordLatency(latency: number): void {
    this.latencyBuffer.push(latency);
    this.requestCount++;
  }

  recordError(): void {
    this.errorCount++;
    this.requestCount++;
  }

  aggregate(): SystemMetrics | null {
    const now = Date.now();
    const elapsed = now - this.lastAggregation;

    // Aggregate every minute
    if (elapsed < 60000 || this.latencyBuffer.length === 0) {
      return null;
    }

    const sorted = [...this.latencyBuffer].sort((a, b) => a - b);
    const p50Index = Math.floor(sorted.length * 0.5);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    const metrics: SystemMetrics = {
      timestamp: now,
      latencyP50: sorted[p50Index] || 0,
      latencyP95: sorted[p95Index] || 0,
      latencyP99: sorted[p99Index] || 0,
      errorRate: this.requestCount > 0 ? this.errorCount / this.requestCount : 0,
      throughput: (this.requestCount / elapsed) * 1000, // requests per second
      cpuUsage: this.simulateCPU(),
      memoryUsage: this.simulateMemory(),
      cacheHitRate: Math.random() * 0.3 + 0.7 // 70-100%
    };

    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }

    // Reset buffers
    this.latencyBuffer = [];
    this.errorCount = 0;
    this.requestCount = 0;
    this.lastAggregation = now;

    return metrics;
  }

  private simulateCPU(): number {
    // Simulate CPU based on throughput
    const baseLoad = 0.3;
    const load = baseLoad + Math.random() * 0.2;
    return Math.min(1.0, load);
  }

  private simulateMemory(): number {
    // Simulate memory usage
    const baseUsage = 0.5;
    const usage = baseUsage + Math.random() * 0.1;
    return Math.min(1.0, usage);
  }

  getRecentMetrics(count: number = 60): SystemMetrics[] {
    return this.metricsHistory.slice(-count);
  }

  getLatestMetrics(): SystemMetrics | null {
    return this.metricsHistory[this.metricsHistory.length - 1] || null;
  }

  calculatePerformanceScore(metrics: SystemMetrics): number {
    // Weighted scoring: latency (50%), error rate (30%), throughput (20%)
    const latencyScore = Math.max(0, 1 - metrics.latencyP95 / 200); // normalize to 200ms max
    const errorScore = Math.max(0, 1 - metrics.errorRate * 10); // penalize errors heavily
    const throughputScore = Math.min(1, metrics.throughput / 100); // normalize to 100 rps max

    return (latencyScore * 0.5 + errorScore * 0.3 + throughputScore * 0.2) * 100;
  }
}
