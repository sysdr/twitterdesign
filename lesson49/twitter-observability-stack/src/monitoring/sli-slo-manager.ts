import { SLIMetric, SLO } from '../shared/types';
import { MetricsCollector } from '../shared/metrics';

export class SLISLOManager {
  private slos: Map<string, SLO> = new Map();
  private sliHistory: Map<string, SLIMetric[]> = new Map();
  private metrics: MetricsCollector;

  constructor() {
    this.metrics = MetricsCollector.getInstance();
    this.initializeSLOs();
  }

  private initializeSLOs(): void {
    // Timeline Load Latency SLO
    this.slos.set('timeline_latency', {
      name: 'timeline_latency',
      target: 95, // 95% of requests < 200ms
      window: '5m',
      sli: 'timeline_load_duration_seconds',
    });

    // Tweet Post Success Rate SLO
    this.slos.set('tweet_post_success', {
      name: 'tweet_post_success',
      target: 99.9, // 99.9% success rate
      window: '5m',
      sli: 'tweet_post_success_rate',
    });

    // Cache Hit Rate SLO
    this.slos.set('cache_hit_rate', {
      name: 'cache_hit_rate',
      target: 85, // 85% cache hits
      window: '5m',
      sli: 'cache_hit_percentage',
    });
  }

  public recordSLI(metric: SLIMetric): void {
    if (!this.sliHistory.has(metric.name)) {
      this.sliHistory.set(metric.name, []);
    }

    const history = this.sliHistory.get(metric.name)!;
    history.push(metric);

    // Keep only last 1 hour of data
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.sliHistory.set(
      metric.name,
      history.filter(m => m.timestamp > oneHourAgo)
    );

    this.updateSLOCompliance(metric.name);
  }

  private updateSLOCompliance(sliName: string): void {
    const slo = this.slos.get(sliName);
    if (!slo) return;

    const history = this.sliHistory.get(sliName) || [];
    if (history.length === 0) return;

    const windowMs = this.parseWindow(slo.window);
    const cutoff = Date.now() - windowMs;
    const recentMetrics = history.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) return;

    let compliance = 0;

    if (sliName === 'timeline_latency') {
      // P95 latency compliance
      const latencies = recentMetrics.map(m => m.value).sort((a, b) => a - b);
      const p95Index = Math.floor(latencies.length * 0.95);
      const p95Latency = latencies[p95Index];
      compliance = p95Latency < 0.2 ? 100 : 0; // <200ms
    } else if (sliName === 'tweet_post_success') {
      // Success rate compliance
      const successRate = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
      compliance = successRate * 100;
    } else if (sliName === 'cache_hit_rate') {
      // Cache hit rate compliance
      const avgHitRate = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
      compliance = avgHitRate;
    }

    this.metrics.sliCompliance.set({ sli_name: sliName, window: slo.window }, compliance);
  }

  private parseWindow(window: string): number {
    const value = parseInt(window);
    const unit = window.slice(-1);
    const multipliers: Record<string, number> = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
    };
    return value * (multipliers[unit] || 60000);
  }

  public getSLOStatus(): Array<{ name: string; target: number; current: number; status: string }> {
    const status: Array<{ name: string; target: number; current: number; status: string }> = [];

    for (const [name, slo] of this.slos.entries()) {
      const history = this.sliHistory.get(name) || [];
      if (history.length === 0) continue;

      const windowMs = this.parseWindow(slo.window);
      const cutoff = Date.now() - windowMs;
      const recentMetrics = history.filter(m => m.timestamp > cutoff);

      let current = 0;
      if (name === 'timeline_latency') {
        // For latency, calculate percentage of requests meeting the threshold (< 200ms)
        const latencies = recentMetrics.map(m => m.value);
        const underThreshold = latencies.filter(l => l < 0.2).length;
        current = (underThreshold / latencies.length) * 100; // Percentage meeting SLO
      } else {
        current = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
        // For success rate and cache hit rate, convert to percentage if needed
        if (name === 'tweet_post_success') {
          current = current * 100;
        }
      }

      const statusStr = current >= slo.target * 0.9 ? 'healthy' : current >= slo.target * 0.8 ? 'warning' : 'critical';

      status.push({
        name: slo.name,
        target: slo.target,
        current,
        status: statusStr,
      });
    }

    return status;
  }
}
