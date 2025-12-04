import { ResourceMetrics } from '../types';

export class ResourceMonitor {
  private metrics: ResourceMetrics[] = [];
  private instanceCount: number = 2;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.collectMetrics();
    }, 10000); // Every 10 seconds
  }

  collectMetrics(): ResourceMetrics {
    // Simulate realistic metrics
    const baseLoad = 0.3 + Math.random() * 0.3;
    const metric: ResourceMetrics = {
      timestamp: new Date(),
      cpuUtilization: Math.min(100, baseLoad * 100 + Math.random() * 20),
      memoryUtilization: 40 + Math.random() * 30,
      requestRate: 50 + Math.random() * 100,
      p95Latency: 50 + Math.random() * 150,
      activeInstances: this.instanceCount
    };

    this.metrics.push(metric);

    // Keep last 6 hours
    const sixHoursAgo = Date.now() - 6 * 3600000;
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > sixHoursAgo);

    return metric;
  }

  getAverageUtilization(minutes: number = 10): number {
    const cutoff = Date.now() - minutes * 60000;
    const recent = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
    
    if (recent.length === 0) return 50;

    const avgCpu = recent.reduce((sum, m) => sum + m.cpuUtilization, 0) / recent.length;
    return avgCpu;
  }

  getAverageLatency(minutes: number = 10): number {
    const cutoff = Date.now() - minutes * 60000;
    const recent = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
    
    if (recent.length === 0) return 100;

    return recent.reduce((sum, m) => sum + m.p95Latency, 0) / recent.length;
  }

  getCurrentMetrics(): ResourceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getAllMetrics(): ResourceMetrics[] {
    return [...this.metrics];
  }

  setInstanceCount(count: number): void {
    this.instanceCount = count;
  }

  getInstanceCount(): number {
    return this.instanceCount;
  }
}
