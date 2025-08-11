import { register, Counter, Histogram, Gauge } from 'prom-client';

export class MetricsService {
  private requestDuration: Histogram<string>;
  private requestCount: Counter<string>;
  private cacheHitRate: Gauge<string>;

  constructor() {
    // Clear default metrics
    register.clear();

    this.requestDuration = new Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in milliseconds',
      labelNames: ['method', 'route'],
      buckets: [1, 5, 15, 50, 100, 500, 1000, 5000]
    });

    this.requestCount = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status']
    });

    this.cacheHitRate = new Gauge({
      name: 'cache_hit_rate',
      help: 'Cache hit rate percentage',
      labelNames: ['layer']
    });
  }

  recordRequestDuration(method: string, route: string, duration: number): void {
    this.requestDuration.labels(method, route).observe(duration);
  }

  recordRequestCount(method: string, route: string, status: string): void {
    this.requestCount.labels(method, route, status).inc();
  }

  updateCacheHitRate(layer: string, rate: number): void {
    this.cacheHitRate.labels(layer).set(rate);
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
