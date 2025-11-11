import { ExperimentMetrics, SystemHealth, ServiceHealth } from '../chaos/types.js';

export class MetricsCollector {
  private requestLatencies: number[] = [];
  private errorCount = 0;
  private requestCount = 0;
  private serviceStatus: Map<string, ServiceHealth> = new Map();

  recordRequest(latency: number, isError: boolean): void {
    this.requestLatencies.push(latency);
    this.requestCount++;
    
    if (isError) {
      this.errorCount++;
    }

    // Keep only last 1000 requests
    if (this.requestLatencies.length > 1000) {
      this.requestLatencies.shift();
    }
  }

  updateServiceHealth(service: string, health: ServiceHealth): void {
    this.serviceStatus.set(service, health);
  }

  getMetrics(): ExperimentMetrics {
    const sorted = [...this.requestLatencies].sort((a, b) => a - b);
    
    return {
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      latencyP50: this.calculatePercentile(sorted, 50),
      latencyP95: this.calculatePercentile(sorted, 95),
      latencyP99: this.calculatePercentile(sorted, 99),
      requestCount: this.requestCount,
      failedRequests: this.errorCount
    };
  }

  getSystemHealth(): SystemHealth {
    const services = new Map<string, ServiceHealth>();
    
    // Add service statuses
    this.serviceStatus.forEach((health, name) => {
      services.set(name, health);
    });

    // Calculate overall health
    let totalHealth = 0;
    services.forEach(health => {
      const score = health.status === 'healthy' ? 100 :
                   health.status === 'degraded' ? 50 : 0;
      totalHealth += score;
    });

    const overall = services.size > 0 ? totalHealth / services.size : 100;

    return {
      overall,
      services,
      timestamp: Date.now()
    };
  }

  private calculatePercentile(sorted: number[], percentile: number): number {
    if (sorted.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  reset(): void {
    this.requestLatencies = [];
    this.errorCount = 0;
    this.requestCount = 0;
  }
}

export const metricsCollector = new MetricsCollector();
