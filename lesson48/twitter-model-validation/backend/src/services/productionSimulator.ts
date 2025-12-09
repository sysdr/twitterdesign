export class ProductionSimulator {
  private arrivalRate: number = 45; // requests/sec
  private requestCount: number = 0;
  private uniqueItems: number = 5000;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private queueDepth: number = 2;

  tick() {
    // Simulate traffic variation
    const variation = Math.sin(Date.now() / 10000) * 10;
    this.arrivalRate = Math.max(30, 45 + variation + Math.random() * 10);

    // Simulate requests
    const requests = Math.floor(this.arrivalRate);
    this.requestCount += requests;

    // Simulate cache behavior
    const hitRate = 0.82 + Math.random() * 0.08;
    this.cacheHits += Math.floor(requests * hitRate);
    this.cacheMisses += Math.floor(requests * (1 - hitRate));

    // Simulate queue depth
    const utilization = this.arrivalRate / 60;
    this.queueDepth = Math.max(0, utilization / (1 - utilization) + (Math.random() - 0.5));

    // Simulate working set changes
    if (Math.random() < 0.01) {
      this.uniqueItems += Math.floor((Math.random() - 0.5) * 100);
      this.uniqueItems = Math.max(1000, Math.min(10000, this.uniqueItems));
    }
  }

  getMetrics() {
    return {
      arrivalRate: this.arrivalRate,
      requestCount: this.requestCount,
      uniqueItems: this.uniqueItems,
      cacheHits: this.cacheHits,
      totalRequests: this.cacheHits + this.cacheMisses,
      queueDepth: this.queueDepth
    };
  }

  reset() {
    this.requestCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}
