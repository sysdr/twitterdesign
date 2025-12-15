class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: [],
      backups: [],
      failovers: [],
      healthChecks: []
    };
    this.startTime = Date.now();
  }

  recordRequest(latency, success = true) {
    this.metrics.requests.push({
      timestamp: Date.now(),
      latency,
      success
    });
    
    // Keep last 1000 requests
    if (this.metrics.requests.length > 1000) {
      this.metrics.requests.shift();
    }
  }

  recordBackup(type, size, duration) {
    this.metrics.backups.push({
      timestamp: Date.now(),
      type,
      size,
      duration
    });
  }

  recordFailover(rto, success) {
    this.metrics.failovers.push({
      timestamp: Date.now(),
      rto,
      success
    });
  }

  getMetrics() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    // Calculate request metrics
    const recentRequests = this.metrics.requests.filter(
      r => now - r.timestamp < 60000
    );
    const successfulRequests = recentRequests.filter(r => r.success);
    
    const avgLatency = recentRequests.length > 0
      ? recentRequests.reduce((sum, r) => sum + r.latency, 0) / recentRequests.length
      : 0;
    
    const errorRate = recentRequests.length > 0
      ? ((recentRequests.length - successfulRequests.length) / recentRequests.length * 100)
      : 0;

    return {
      system: {
        uptime,
        uptimeFormatted: this.formatUptime(uptime)
      },
      requests: {
        total: this.metrics.requests.length,
        perSecond: recentRequests.length / 60,
        avgLatency: avgLatency.toFixed(2),
        errorRate: errorRate.toFixed(2)
      },
      backups: {
        total: this.metrics.backups.length,
        lastBackup: this.metrics.backups[this.metrics.backups.length - 1]
      },
      failovers: {
        total: this.metrics.failovers.length,
        successful: this.metrics.failovers.filter(f => f.success).length
      }
    };
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

module.exports = new MetricsCollector();
