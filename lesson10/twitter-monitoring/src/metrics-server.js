const express = require('express');
const promClient = require('prom-client');
const promBundle = require('express-prom-bundle');

const app = express();
const port = 3001;

// Add the options to the prometheus middleware
const promMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: {
    project_name: 'twitter-clone',
    project_type: 'social-media'
  },
  promClient: {
    collectDefaultMetrics: {}
  }
});

app.use(promMiddleware);

// Custom metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'twitter_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'endpoint', 'status_code']
});

const activeUsersGauge = new promClient.Gauge({
  name: 'twitter_active_users',
  help: 'Number of currently active users'
});

const tweetCreationDuration = new promClient.Histogram({
  name: 'twitter_tweet_creation_duration_seconds',
  help: 'Tweet creation duration in seconds',
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

// Simulate real-time metrics
let requestCount = 0;
let errorCount = 0;

setInterval(() => {
  // Simulate varying load
  const baseRequests = 50 + Math.sin(Date.now() / 10000) * 30;
  requestCount += Math.floor(baseRequests + Math.random() * 20);
  
  // Simulate occasional errors
  if (Math.random() < 0.05) {
    errorCount += Math.floor(Math.random() * 3);
  }
  
  // Update gauges
  activeUsersGauge.set(Math.floor(Math.random() * 1000) + 500);
  
  // Simulate tweet creation times
  tweetCreationDuration.observe(Math.random() * 2 + 0.1);
}, 1000);

// API endpoints
app.get('/api/metrics', (req, res) => {
  const now = Date.now();
  const metrics = {
    timestamp: now,
    cpu: Math.floor(Math.random() * 40) + 30,
    memory: Math.floor(Math.random() * 30) + 50,
    requests: Math.floor(Math.random() * 100) + 50,
    errors: Math.floor(Math.random() * 5),
    latency: Math.floor(Math.random() * 200) + 50
  };
  
  httpRequestsTotal.labels('GET', '/api/metrics', '200').inc();
  res.json(metrics);
});

app.get('/api/alerts', (req, res) => {
  const alerts = [];
  
  // Simulate alerts based on current metrics
  if (Math.random() < 0.3) {
    alerts.push({
      name: 'High CPU Usage',
      status: 'firing',
      severity: 'warning',
      message: 'CPU usage is above 80% for the last 5 minutes'
    });
  }
  
  if (Math.random() < 0.1) {
    alerts.push({
      name: 'Database Connection Pool',
      status: 'firing',
      severity: 'critical',
      message: 'Database connection pool is exhausted'
    });
  }
  
  httpRequestsTotal.labels('GET', '/api/alerts', '200').inc();
  res.json(alerts);
});

// Prometheus metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Metrics server running on http://localhost:${port}`);
  console.log(`📊 Prometheus metrics available at http://localhost:${port}/metrics`);
});
