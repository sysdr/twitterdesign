const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// Import services (simulate TypeScript classes in Node.js)
class CostTracker {
  constructor() {
    this.metrics = [];
    this.instanceType = 't3.medium';
    this.currentHourCost = 0;
    this.hourStartTime = Date.now();
  }

  trackRequest(duration, dbReads, dbWrites, cacheOps, responseSize) {
    const computeCost = (duration / 3600) * 0.0416;
    const databaseCost = (dbReads * 0.0000001) + (dbWrites * 0.000001);
    const cacheCost = cacheOps * 0.00000001;
    const networkCost = (responseSize / (1024 * 1024 * 1024)) * 0.09;
    const totalCost = computeCost + databaseCost + cacheCost + networkCost;

    // Reset hourly cost if an hour has passed
    const now = Date.now();
    if (now - this.hourStartTime > 3600000) {
      this.currentHourCost = 0;
      this.hourStartTime = now;
    }
    this.currentHourCost += totalCost;

    const metric = {
      timestamp: new Date(),
      computeCost,
      databaseCost,
      cacheCost,
      networkCost,
      totalCost
    };

    this.metrics.push(metric);
    
    // Keep only last hour of data
    const oneHourAgo = now - 3600000;
    this.metrics = this.metrics.filter(m => new Date(m.timestamp).getTime() > oneHourAgo);

    return metric;
  }

  getCurrentHourCost() {
    return this.currentHourCost;
  }

  getProjectedDailyCost() {
    const hourlyAvg = this.currentHourCost;
    return hourlyAvg * 24;
  }
}

class ResourceMonitor {
  constructor() {
    this.metrics = [];
    this.instanceCount = 2;
  }

  collectMetrics() {
    const baseLoad = 0.3 + Math.random() * 0.3;
    const metric = {
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
    this.metrics = this.metrics.filter(m => new Date(m.timestamp).getTime() > sixHoursAgo);
    
    return metric;
  }
}

class OptimizationEngine {
  generateRecommendations() {
    return [
      {
        id: 'db-cache',
        type: 'caching',
        description: 'Implement aggressive database query caching',
        estimatedSavings: 45,
        impact: 'high',
        confidence: 0.85
      },
      {
        id: 'instance-downsize',
        type: 'instance_type',
        description: 'Switch to smaller instance type (t3.small)',
        estimatedSavings: 50,
        impact: 'medium',
        confidence: 0.90
      },
      {
        id: 'reserved-instances',
        type: 'instance_type',
        description: 'Convert to reserved instances for stable workload',
        estimatedSavings: 40,
        impact: 'low',
        confidence: 0.95
      },
      {
        id: 'cdn-images',
        type: 'caching',
        description: 'Move images to CDN to reduce egress costs',
        estimatedSavings: 30,
        impact: 'medium',
        confidence: 0.80
      }
    ];
  }
}

class PredictiveAnalytics {
  forecastNextWeek() {
    const baseCost = 50 + Math.random() * 20;
    return Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 24 * 3600000),
      predictedCost: baseCost + (Math.random() - 0.5) * 10,
      confidence: 0.85 - (i * 0.02),
      upperBound: baseCost * 1.2,
      lowerBound: baseCost * 0.8
    }));
  }
}

const costTracker = new CostTracker();
const resourceMonitor = new ResourceMonitor();
const optimizationEngine = new OptimizationEngine();
const predictiveAnalytics = new PredictiveAnalytics();

let totalSavings = 0;

// Broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Simulate metrics generation
setInterval(() => {
  // Simulate a request
  const duration = 0.1 + Math.random() * 0.5;
  const dbReads = Math.floor(Math.random() * 10);
  const dbWrites = Math.floor(Math.random() * 3);
  const cacheOps = Math.floor(Math.random() * 20);
  const responseSize = 1024 + Math.random() * 10240;

  const costMetrics = costTracker.trackRequest(duration, dbReads, dbWrites, cacheOps, responseSize);
  broadcast({ type: 'cost_metrics', payload: costMetrics });

  // Calculate savings (40% reduction target)
  totalSavings += costMetrics.totalCost * 0.4;
}, 1000);

setInterval(() => {
  const resourceMetrics = resourceMonitor.collectMetrics();
  broadcast({ type: 'resource_metrics', payload: resourceMetrics });
}, 10000);

setInterval(() => {
  const recommendations = optimizationEngine.generateRecommendations();
  broadcast({ type: 'recommendations', payload: recommendations });
}, 30000);

setInterval(() => {
  const forecast = predictiveAnalytics.forecastNextWeek();
  broadcast({ type: 'forecast', payload: forecast });
}, 60000);

setInterval(() => {
  // Calculate projected daily cost from actual tracked costs
  const currentHourCost = costTracker.getCurrentHourCost();
  const projectedDailyCost = costTracker.getProjectedDailyCost();
  broadcast({ 
    type: 'summary', 
    payload: { 
      currentHourCost,
      projectedDailyCost,
      totalSavings 
    } 
  });
}, 5000);

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial data immediately
  ws.send(JSON.stringify({ 
    type: 'recommendations', 
    payload: optimizationEngine.generateRecommendations() 
  }));
  
  ws.send(JSON.stringify({ 
    type: 'forecast', 
    payload: predictiveAnalytics.forecastNextWeek() 
  }));

  // Send initial summary
  const currentHourCost = costTracker.getCurrentHourCost();
  const projectedDailyCost = costTracker.getProjectedDailyCost();
  ws.send(JSON.stringify({ 
    type: 'summary', 
    payload: { 
      currentHourCost,
      projectedDailyCost,
      totalSavings 
    } 
  }));

  // Send initial cost and resource metrics if available
  if (costTracker.metrics.length > 0) {
    const lastCost = costTracker.metrics[costTracker.metrics.length - 1];
    ws.send(JSON.stringify({ type: 'cost_metrics', payload: lastCost }));
  }
  
  if (resourceMonitor.metrics.length > 0) {
    const lastResource = resourceMonitor.metrics[resourceMonitor.metrics.length - 1];
    ws.send(JSON.stringify({ type: 'resource_metrics', payload: lastResource }));
  }

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Cost Optimization Server running on http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});
