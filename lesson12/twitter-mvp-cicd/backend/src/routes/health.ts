import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  const environment = process.env.NODE_ENV || 'development';
  const deployment = process.env.NODE_ENV || 'local';
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment,
    deployment,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

router.get('/metrics', (req, res) => {
  // Basic Prometheus metrics
  const metrics = `
# HELP nodejs_memory_usage_bytes Node.js memory usage
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}
nodejs_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}
nodejs_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}

# HELP nodejs_uptime_seconds Node.js uptime
# TYPE nodejs_uptime_seconds counter
nodejs_uptime_seconds ${process.uptime()}
`;
  
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

export default router;
