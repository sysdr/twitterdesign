module.exports = {
  healthCheck: {
    shallow: { interval: 10000, timeout: 5000 },  // 10s
    medium: { interval: 60000, timeout: 10000 },   // 60s
    deep: { interval: 300000, timeout: 30000 }     // 5min
  },
  failover: {
    rto: 900000,  // 15 minutes
    rpo: 300000,  // 5 minutes
    maxFailureCount: 3,
    failureWindow: 60000,
    autoFailover: true
  },
  monitoring: {
    port: 9090,
    metricsInterval: 10000
  }
};
