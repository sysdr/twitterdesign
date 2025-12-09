import { ActualMetric } from '../types/index.js';

export class MetricsCollector {
  private metrics: ActualMetric[] = [];
  private readonly MAX_METRICS = 10000;

  // Simulate actual production metrics
  collectTimelineLatency(requestCount: number): ActualMetric {
    // Simulate realistic latency with some variance
    const baseLatency = 150 + Math.random() * 50;
    const loadFactor = Math.min(requestCount / 50, 2);
    const actualLatency = baseLatency * loadFactor;

    const metric: ActualMetric = {
      timestamp: Date.now(),
      metricName: 'p95_latency_ms',
      actualValue: actualLatency,
      context: {
        operationType: 'timeline_fetch'
      }
    };

    this.storeMetric(metric);
    return metric;
  }

  collectCacheHitRate(cacheHits: number, totalRequests: number): ActualMetric {
    const hitRate = (cacheHits / totalRequests) * 100;

    const metric: ActualMetric = {
      timestamp: Date.now(),
      metricName: 'hit_rate_percent',
      actualValue: hitRate,
      context: {
        operationType: 'cache_access'
      }
    };

    this.storeMetric(metric);
    return metric;
  }

  collectQueueDepth(currentDepth: number): ActualMetric {
    const metric: ActualMetric = {
      timestamp: Date.now(),
      metricName: 'avg_queue_depth',
      actualValue: currentDepth,
      context: {
        operationType: 'queue_monitoring'
      }
    };

    this.storeMetric(metric);
    return metric;
  }

  private storeMetric(metric: ActualMetric) {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  getMetrics(metricName: string, startTime: number, endTime: number): ActualMetric[] {
    return this.metrics.filter(m => 
      m.metricName === metricName &&
      m.timestamp >= startTime &&
      m.timestamp <= endTime
    );
  }

  getRecentMetrics(metricName: string, count: number = 100): ActualMetric[] {
    return this.metrics
      .filter(m => m.metricName === metricName)
      .slice(-count);
  }

  clearOldMetrics(olderThan: number) {
    this.metrics = this.metrics.filter(m => m.timestamp > olderThan);
  }
}
