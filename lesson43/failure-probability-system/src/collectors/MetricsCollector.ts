// Real-time system metrics collection for failure prediction

export interface SystemMetrics {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  memoryGrowthRate: number;
  errorRate: number;
  responseTime: number;
  responseTimeVariance: number;
  queueDepth: number;
  activeConnections: number;
  diskIOWait: number;
  networkLatency: number;
}

export class MetricsCollector {
  private metrics: SystemMetrics[] = [];
  private baseMemory: number = 100;
  private simulatedLoad: number = 0;
  private errorCount: number = 0;
  private requestCount: number = 0;
  
  constructor(private collectionInterval: number = 1000) {}
  
  // Start collecting metrics
  startCollection(onMetric: (metric: SystemMetrics) => void): void {
    setInterval(() => {
      const metric = this.collectMetric();
      this.metrics.push(metric);
      
      // Keep last 1000 samples
      if (this.metrics.length > 1000) {
        this.metrics.shift();
      }
      
      onMetric(metric);
    }, this.collectionInterval);
  }
  
  // Simulate system load for demonstration
  simulateLoad(load: number): void {
    this.simulatedLoad = Math.max(0, Math.min(100, load));
  }
  
  // Inject simulated errors
  injectError(): void {
    this.errorCount++;
  }
  
  private collectMetric(): SystemMetrics {
    const now = Date.now();
    
    // Simulate realistic system behavior with gradual degradation
    const timeMinutes = (now % 3600000) / 60000;
    const degradationFactor = Math.min(1 + timeMinutes / 60, 1.5);
    
    // CPU usage increases with load and degradation
    const cpuUsage = 20 + this.simulatedLoad * 0.6 + 
                     Math.random() * 10 + 
                     degradationFactor * 5;
    
    // Memory grows over time (simulating memory leak)
    this.baseMemory += degradationFactor * 0.1 + Math.random() * 0.5;
    const memoryUsage = Math.min(95, this.baseMemory);
    
    // Calculate memory growth rate
    const memoryGrowthRate = this.metrics.length > 10 ?
      (memoryUsage - this.metrics[this.metrics.length - 10].memoryUsage) / 10 : 0;
    
    // Error rate increases with system stress
    this.requestCount++;
    const stressFactor = Math.max(0, cpuUsage - 70) / 30;
    const naturalErrors = Math.random() < (0.001 * degradationFactor * (1 + stressFactor)) ? 1 : 0;
    this.errorCount += naturalErrors;
    const errorRate = this.errorCount / this.requestCount;
    
    // Response time increases under load
    const baseResponseTime = 50 + this.simulatedLoad * 2;
    const variance = (cpuUsage > 80 ? 50 : 20) * degradationFactor;
    const responseTime = baseResponseTime + (Math.random() - 0.5) * variance;
    
    // Response time variance increases as system degrades
    const recentResponses = this.metrics.slice(-20).map(m => m.responseTime);
    const responseTimeVariance = recentResponses.length > 1 ?
      this.calculateVariance(recentResponses) : 0;
    
    // Queue depth grows when system is overloaded
    const queueDepth = Math.max(0, 
      Math.floor((cpuUsage - 70) * 2 + Math.random() * 10));
    
    // Active connections increase with load
    const activeConnections = Math.floor(100 + this.simulatedLoad * 5 + 
                                        Math.random() * 20);
    
    // Disk I/O wait increases with degradation
    const diskIOWait = 5 + degradationFactor * 3 + Math.random() * 5;
    
    // Network latency varies
    const networkLatency = 10 + Math.random() * 20 + stressFactor * 10;
    
    return {
      timestamp: now,
      cpuUsage: Math.min(100, cpuUsage),
      memoryUsage,
      memoryGrowthRate,
      errorRate,
      responseTime: Math.max(0, responseTime),
      responseTimeVariance,
      queueDepth,
      activeConnections,
      diskIOWait,
      networkLatency
    };
  }
  
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }
  
  getRecentMetrics(count: number = 100): SystemMetrics[] {
    return this.metrics.slice(-count);
  }
  
  getAllMetrics(): SystemMetrics[] {
    return this.metrics;
  }
}
