import { register, Counter, Histogram, Gauge } from 'prom-client';

export class MetricsCollector {
  private static instance: MetricsCollector;

  public requestDuration: Histogram<string>;
  public requestCount: Counter<string>;
  public activeConnections: Gauge<string>;
  public cacheHitRate: Gauge<string>;
  public sliCompliance: Gauge<string>;

  private constructor() {
    this.requestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['service', 'method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    });

    this.requestCount = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['service', 'method', 'route', 'status'],
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['service'],
    });

    this.cacheHitRate = new Gauge({
      name: 'cache_hit_rate',
      help: 'Cache hit rate percentage',
      labelNames: ['service', 'cache_type'],
    });

    this.sliCompliance = new Gauge({
      name: 'sli_compliance_percentage',
      help: 'SLI compliance percentage',
      labelNames: ['sli_name', 'window'],
    });
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  public getMetrics(): Promise<string> {
    return register.metrics();
  }
}
