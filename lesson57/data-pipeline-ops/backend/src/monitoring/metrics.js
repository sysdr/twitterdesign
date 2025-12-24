export class MetricsCollector {
  constructor() {
    this.metrics = {
      throughput: 0,
      errorRate: 0,
      latency: {
        p50: 0,
        p95: 0,
        p99: 0
      },
      dataQuality: 100,
      pipelinesActive: 0,
      eventsProcessed: 0,
      validationStats: {},
      recoveryStats: {},
      storageStats: {}
    };
    
    this.latencyBuffer = [];
    this.bufferSize = 1000;
  }

  recordLatency(ms) {
    this.latencyBuffer.push(ms);
    if (this.latencyBuffer.length > this.bufferSize) {
      this.latencyBuffer.shift();
    }
    this.calculatePercentiles();
  }

  calculatePercentiles() {
    if (this.latencyBuffer.length === 0) return;
    
    const sorted = [...this.latencyBuffer].sort((a, b) => a - b);
    const p50Index = Math.floor(sorted.length * 0.5);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);
    
    this.metrics.latency.p50 = sorted[p50Index] || 0;
    this.metrics.latency.p95 = sorted[p95Index] || 0;
    this.metrics.latency.p99 = sorted[p99Index] || 0;
  }

  update(orchestratorMetrics, validator, recovery, storage) {
    this.metrics.throughput = orchestratorMetrics.throughput;
    this.metrics.errorRate = orchestratorMetrics.errorRate;
    this.metrics.eventsProcessed = orchestratorMetrics.processed;
    
    // Update latency percentiles from orchestrator
    if (orchestratorMetrics.latency) {
      this.metrics.latency = orchestratorMetrics.latency;
    }
    
    if (validator) {
      this.metrics.validationStats = validator.getStats();
      this.metrics.dataQuality = parseFloat(this.metrics.validationStats.successRate);
    }
    
    if (recovery) {
      this.metrics.recoveryStats = recovery.getStats();
    }
    
    if (storage) {
      this.metrics.storageStats = storage.getStats();
    }
  }

  getSnapshot() {
    return { ...this.metrics, timestamp: Date.now() };
  }
}
