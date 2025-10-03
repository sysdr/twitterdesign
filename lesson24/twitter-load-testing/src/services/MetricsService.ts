import { LoadTestMetrics, RegionalPerformance } from '../types';

export class MetricsService {
  private metrics: LoadTestMetrics[] = [];

  addMetrics(newMetrics: LoadTestMetrics[]): void {
    this.metrics.push(...newMetrics);
    
    // Keep only last 5000 metrics
    if (this.metrics.length > 5000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  getRegionalPerformance(): RegionalPerformance[] {
    const regions = [...new Set(this.metrics.map(m => m.region))];
    
    return regions.map(region => {
      const regionMetrics = this.metrics.filter(m => m.region === region);
      
      if (regionMetrics.length === 0) {
        return {
          region,
          averageLatency: 0,
          p95Latency: 0,
          p99Latency: 0,
          successRate: 0,
          throughput: 0
        };
      }

      const sortedLatencies = regionMetrics
        .map(m => m.responseTime)
        .sort((a, b) => a - b);

      const averageLatency = sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length;
      const p95Index = Math.floor(sortedLatencies.length * 0.95);
      const p99Index = Math.floor(sortedLatencies.length * 0.99);
      
      const totalRequests = regionMetrics.length;
      const successfulRequests = regionMetrics.filter(m => m.errorRate === 0).length;
      const successRate = (successfulRequests / totalRequests) * 100;
      
      const throughput = regionMetrics
        .filter(m => m.timestamp > Date.now() - 60000) // Last minute
        .length;

      return {
        region,
        averageLatency: Math.round(averageLatency),
        p95Latency: sortedLatencies[p95Index] || 0,
        p99Latency: sortedLatencies[p99Index] || 0,
        successRate: Math.round(successRate * 100) / 100,
        throughput
      };
    });
  }

  getRealtimeMetrics(): LoadTestMetrics[] {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp > fiveMinutesAgo);
  }

  getMetricsByRegion(regionId: string): LoadTestMetrics[] {
    return this.metrics.filter(m => m.region === regionId);
  }
}
