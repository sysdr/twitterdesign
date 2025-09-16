class MetricsService {
  constructor() {
    this.metrics = {
      messagesPerSecond: 0,
      totalMessages: 0,
      activePartitions: 12,
      consumerLag: 0,
      averageLatency: 0
    };
    
    this.messageCount = 0;
    this.lastSecondCount = 0;
    this.latencies = [];
    this.isRunning = false;
  }

  async start() {
    this.isRunning = true;
    
    // Calculate messages per second
    setInterval(() => {
      this.metrics.messagesPerSecond = this.messageCount - this.lastSecondCount;
      this.lastSecondCount = this.messageCount;
      
      // Calculate average latency
      if (this.latencies.length > 0) {
        this.metrics.averageLatency = this.latencies.reduce((a, b) => a + b) / this.latencies.length;
        this.latencies = []; // Reset for next interval
      }
    }, 1000);
    
    console.log('✅ Metrics service started');
  }

  async stop() {
    this.isRunning = false;
    console.log('✅ Metrics service stopped');
  }

  recordMessage(latency = 0) {
    this.messageCount++;
    this.metrics.totalMessages = this.messageCount;
    
    if (latency > 0) {
      this.latencies.push(latency);
    }
  }

  recordLatency(latency) {
    this.latencies.push(latency);
  }

  updateConsumerLag(lag) {
    this.metrics.consumerLag = lag;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  // Simulate some realistic metrics for demo
  getEnhancedMetrics() {
    const baseMetrics = this.getMetrics();
    
    return {
      ...baseMetrics,
      partitionMetrics: Array.from({ length: 12 }, (_, i) => ({
        id: i,
        messageCount: Math.floor(Math.random() * 1000) + baseMetrics.totalMessages / 12,
        offset: Math.floor(Math.random() * 10000),
        lag: Math.floor(Math.random() * 100)
      })),
      consumerGroups: [
        {
          groupId: 'tweet-processor',
          members: 3,
          state: 'Stable',
          totalLag: baseMetrics.consumerLag
        },
        {
          groupId: 'timeline-processor',
          members: 2,
          state: 'Stable',
          totalLag: Math.floor(Math.random() * 50)
        }
      ]
    };
  }
}

module.exports = MetricsService;
