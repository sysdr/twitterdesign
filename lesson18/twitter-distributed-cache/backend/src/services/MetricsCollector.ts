import { CacheManager } from '../cache/CacheManager';
import { register, Counter, Histogram, Gauge } from 'prom-client';

export class MetricsCollector {
  private static instance: MetricsCollector;
  private cacheHits: Counter<string>;
  private cacheMisses: Counter<string>;
  private responseTime: Histogram<string>;
  private activeConnections: Gauge<string>;
  private cacheManager: CacheManager;

  private constructor() {
    this.cacheManager = CacheManager.getInstance();
    
    // Clear any existing metrics first
    register.clear();
    
    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['node_id', 'region']
    });

    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['node_id', 'region']
    });

    this.responseTime = new Histogram({
      name: 'cache_response_time_seconds',
      help: 'Cache response time in seconds',
      labelNames: ['operation', 'node_id'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
    });

    this.activeConnections = new Gauge({
      name: 'cache_active_connections',
      help: 'Number of active cache connections',
      labelNames: ['node_id']
    });

    // Listen to cache events
    this.setupEventListeners();
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  private setupEventListeners(): void {
    this.cacheManager.on('cacheGet', (data) => {
      if (data.hit) {
        this.cacheHits.inc({ node_id: data.nodeId, region: 'unknown' });
      } else {
        this.cacheMisses.inc({ node_id: data.nodeId, region: 'unknown' });
      }
      this.responseTime.observe({ operation: 'get', node_id: data.nodeId }, data.responseTime / 1000);
    });

    this.cacheManager.on('cacheSet', (data) => {
      this.responseTime.observe({ operation: 'set', node_id: data.nodeId }, data.responseTime / 1000);
    });
  }

  public async getPrometheusMetrics(): Promise<string> {
    return register.metrics();
  }

  public async getRealTimeMetrics(): Promise<any> {
    const stats = this.cacheManager.getStats();
    const health = await this.cacheManager.getHealthStatus();

    const metrics = {
      timestamp: Date.now(),
      totalHits: 0,
      totalMisses: 0,
      overallHitRate: 0,
      avgResponseTime: 0,
      nodesStats: {},
      health: health
    };

    let totalOps = 0;
    let totalHits = 0;
    let avgResponseSum = 0;

    stats.forEach((stat, nodeId) => {
      const ops = stat.hits + stat.misses;
      totalOps += ops;
      totalHits += stat.hits;
      avgResponseSum += stat.avgResponseTime;

      (metrics.nodesStats as any)[nodeId] = {
        hits: stat.hits,
        misses: stat.misses,
        hitRate: stat.hitRate.toFixed(2),
        avgResponseTime: stat.avgResponseTime.toFixed(2),
        totalOps: ops
      };
    });

    metrics.totalHits = totalHits;
    metrics.totalMisses = totalOps - totalHits;
    metrics.overallHitRate = totalOps > 0 ? (totalHits / totalOps * 100) : 0;
    metrics.avgResponseTime = stats.size > 0 ? (avgResponseSum / stats.size) : 0;

    return metrics;
  }
}
