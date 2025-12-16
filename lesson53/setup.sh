#!/bin/bash

# Lesson 53: Capacity Planning and Auto-Scaling Implementation
# Complete setup script for Twitter auto-scaling system

set -e

echo "=========================================="
echo "Lesson 53: Capacity Planning & Auto-Scaling"
echo "=========================================="

PROJECT_NAME="twitter-autoscaling"
PROJECT_DIR="$(pwd)/$PROJECT_NAME"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Create project structure
print_status "Creating project structure..."
mkdir -p "$PROJECT_DIR"/{src,public,tests,docker}
cd "$PROJECT_DIR"

mkdir -p src/{components,services,models,utils,hooks}
mkdir -p public/assets
mkdir -p tests/{unit,integration}

# Create package.json
print_status "Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "twitter-autoscaling",
  "version": "1.0.0",
  "description": "Capacity Planning and Auto-Scaling System",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "start:metrics": "ts-node src/services/metricsCollector.ts",
    "start:predictor": "ts-node src/services/trafficPredictor.ts",
    "start:scaler": "ts-node src/services/autoScaler.ts",
    "demo": "npm run dev"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.13.3",
    "express": "^4.21.2",
    "pg": "^8.13.1",
    "node-cron": "^3.0.3",
    "axios": "^1.7.9",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@types/node": "^22.10.2",
    "@types/express": "^5.0.0",
    "@types/pg": "^8.11.10",
    "@types/node-cron": "^3.0.11",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "ts-node": "^10.9.2",
    "@types/jest": "^29.5.14",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5"
  }
}
EOF

# Create TypeScript configuration
print_status "Creating tsconfig.json..."
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

# Create Vite configuration
print_status "Creating vite.config.ts..."
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
})
EOF

# Create Jest configuration
print_status "Creating jest.config.js..."
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
};
EOF

# Create data models
print_status "Creating data models..."
cat > src/models/types.ts << 'EOF'
export interface SystemMetrics {
  timestamp: Date;
  serverId: string;
  cpuUsage: number;
  memoryUsage: number;
  requestRate: number;
  activeConnections: number;
  responseTime: number;
}

export interface ServerInstance {
  id: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped';
  region: string;
  capacity: number;
  cost: number;
  launchedAt: Date;
}

export interface ScalingDecision {
  timestamp: Date;
  currentServers: number;
  targetServers: number;
  reason: string;
  predictedLoad: number;
  currentLoad: number;
  costImpact: number;
  approved: boolean;
}

export interface TrafficPrediction {
  timestamp: Date;
  predictedRequestRate: number;
  confidence: number;
  historicalData: number[];
  trend: number;
}

export interface CostAnalysis {
  hourlyRate: number;
  projectedDailyCost: number;
  potentialSavings: number;
  efficiencyScore: number;
}

export interface AutoScalerConfig {
  minServers: number;
  maxServers: number;
  targetUtilization: number;
  serverCapacity: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownPeriod: number;
  costPerServerHour: number;
  maxDailyBudget: number;
}
EOF

# Create metrics collector service
print_status "Creating metrics collector service..."
cat > src/services/metricsCollector.ts << 'EOF'
import { SystemMetrics, ServerInstance } from '../models/types';

export class MetricsCollector {
  private metrics: SystemMetrics[] = [];
  private servers: Map<string, ServerInstance> = new Map();
  private collectionInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeServers();
  }

  private initializeServers(): void {
    // Initialize with 3 servers
    for (let i = 1; i <= 3; i++) {
      const server: ServerInstance = {
        id: `server-${i}`,
        status: 'running',
        region: 'us-east-1',
        capacity: 250, // requests per second
        cost: 0.10, // dollars per hour
        launchedAt: new Date()
      };
      this.servers.set(server.id, server);
    }
  }

  async collectMetrics(): Promise<SystemMetrics[]> {
    const currentMetrics: SystemMetrics[] = [];
    const timestamp = new Date();
    
    // Simulate realistic metrics for each server
    this.servers.forEach((server, serverId) => {
      if (server.status === 'running') {
        const baseLoad = this.calculateBaseLoad();
        const metrics: SystemMetrics = {
          timestamp,
          serverId,
          cpuUsage: this.generateRealisticCPU(baseLoad),
          memoryUsage: this.generateRealisticMemory(),
          requestRate: this.generateRequestRate(baseLoad, server.capacity),
          activeConnections: Math.floor(Math.random() * 1000) + 100,
          responseTime: this.calculateResponseTime(baseLoad)
        };
        currentMetrics.push(metrics);
        this.metrics.push(metrics);
      }
    });

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    return currentMetrics;
  }

  private calculateBaseLoad(): number {
    const hour = new Date().getHours();
    // Simulate daily traffic pattern
    if (hour >= 9 && hour <= 17) {
      return 0.7 + Math.random() * 0.2; // Peak hours: 70-90%
    } else if (hour >= 18 && hour <= 23) {
      return 0.5 + Math.random() * 0.2; // Evening: 50-70%
    } else {
      return 0.2 + Math.random() * 0.1; // Night: 20-30%
    }
  }

  private generateRealisticCPU(baseLoad: number): number {
    const noise = (Math.random() - 0.5) * 0.1;
    return Math.max(0, Math.min(100, (baseLoad * 100) + (noise * 100)));
  }

  private generateRealisticMemory(): number {
    return 40 + Math.random() * 30; // 40-70% memory usage
  }

  private generateRequestRate(baseLoad: number, capacity: number): number {
    return Math.floor(capacity * baseLoad);
  }

  private calculateResponseTime(load: number): number {
    // Response time increases with load
    const baseTime = 50;
    const loadFactor = Math.pow(load, 2) * 200;
    return baseTime + loadFactor;
  }

  getHistoricalMetrics(hours: number = 1): SystemMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  getCurrentServers(): ServerInstance[] {
    return Array.from(this.servers.values());
  }

  addServer(server: ServerInstance): void {
    this.servers.set(server.id, server);
  }

  removeServer(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.status = 'stopping';
      setTimeout(() => {
        this.servers.delete(serverId);
      }, 5000); // 5 second shutdown delay
    }
  }

  startCollection(intervalSeconds: number = 30): void {
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalSeconds * 1000);
  }

  stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }
}

export const metricsCollector = new MetricsCollector();
EOF

# Create traffic predictor service
print_status "Creating traffic predictor service..."
cat > src/services/trafficPredictor.ts << 'EOF'
import { SystemMetrics, TrafficPrediction } from '../models/types';

export class TrafficPredictor {
  private historicalPredictions: TrafficPrediction[] = [];

  async predictNextHour(historicalMetrics: SystemMetrics[]): Promise<TrafficPrediction> {
    const requestRates = this.extractRequestRates(historicalMetrics);
    
    if (requestRates.length < 10) {
      // Not enough data, use current average
      const avgRate = requestRates.reduce((a, b) => a + b, 0) / requestRates.length || 100;
      return {
        timestamp: new Date(),
        predictedRequestRate: avgRate,
        confidence: 0.5,
        historicalData: requestRates,
        trend: 0
      };
    }

    // Apply exponential smoothing
    const alpha = 0.3; // Smoothing factor
    let smoothedValue = requestRates[0];
    
    for (let i = 1; i < requestRates.length; i++) {
      smoothedValue = alpha * requestRates[i] + (1 - alpha) * smoothedValue;
    }

    // Calculate trend
    const trend = this.calculateTrend(requestRates);
    
    // Apply trend to prediction
    const prediction = smoothedValue * (1 + trend);
    
    // Add time-of-day adjustment
    const hourAdjustment = this.getHourlyAdjustment();
    const finalPrediction = prediction * hourAdjustment;

    // Calculate confidence based on data consistency
    const confidence = this.calculateConfidence(requestRates);

    const predictionResult: TrafficPrediction = {
      timestamp: new Date(),
      predictedRequestRate: Math.floor(finalPrediction),
      confidence,
      historicalData: requestRates,
      trend
    };

    this.historicalPredictions.push(predictionResult);
    if (this.historicalPredictions.length > 100) {
      this.historicalPredictions = this.historicalPredictions.slice(-100);
    }

    return predictionResult;
  }

  private extractRequestRates(metrics: SystemMetrics[]): number[] {
    const ratesByTime: Map<number, number[]> = new Map();
    
    metrics.forEach(m => {
      const timeKey = Math.floor(m.timestamp.getTime() / 30000); // 30-second buckets
      if (!ratesByTime.has(timeKey)) {
        ratesByTime.set(timeKey, []);
      }
      ratesByTime.get(timeKey)!.push(m.requestRate);
    });

    // Average rates per time bucket
    const rates: number[] = [];
    ratesByTime.forEach(ratesInBucket => {
      const avg = ratesInBucket.reduce((a, b) => a + b, 0) / ratesInBucket.length;
      rates.push(avg);
    });

    return rates;
  }

  private calculateTrend(data: number[]): number {
    if (data.length < 5) return 0;

    const recent = data.slice(-5);
    const older = data.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / (older.length || 1);
    
    if (olderAvg === 0) return 0;
    
    return (recentAvg - olderAvg) / olderAvg;
  }

  private getHourlyAdjustment(): number {
    const hour = new Date().getHours();
    
    // Peak hours (9am-5pm): +20%
    if (hour >= 9 && hour <= 17) {
      return 1.2;
    }
    // Evening (6pm-11pm): normal
    else if (hour >= 18 && hour <= 23) {
      return 1.0;
    }
    // Night (12am-8am): -40%
    else {
      return 0.6;
    }
  }

  private calculateConfidence(data: number[]): number {
    if (data.length < 10) return 0.5;

    // Calculate coefficient of variation
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;

    // Lower CV = higher confidence
    return Math.max(0.3, Math.min(0.95, 1 - cv));
  }

  getPredictionAccuracy(): number {
    if (this.historicalPredictions.length < 2) return 0;

    let totalError = 0;
    let count = 0;

    for (let i = 1; i < this.historicalPredictions.length; i++) {
      const predicted = this.historicalPredictions[i - 1].predictedRequestRate;
      const actual = this.historicalPredictions[i].historicalData[0] || predicted;
      const error = Math.abs(predicted - actual) / actual;
      totalError += error;
      count++;
    }

    const avgError = totalError / count;
    return Math.max(0, 1 - avgError);
  }
}

export const trafficPredictor = new TrafficPredictor();
EOF

# Create cost calculator service
print_status "Creating cost calculator service..."
cat > src/services/costCalculator.ts << 'EOF'
import { CostAnalysis, ServerInstance, AutoScalerConfig } from '../models/types';

export class CostCalculator {
  private config: AutoScalerConfig;

  constructor(config: AutoScalerConfig) {
    this.config = config;
  }

  calculateScalingCost(serverCount: number, durationHours: number): number {
    return serverCount * this.config.costPerServerHour * durationHours;
  }

  estimateRevenueImpact(responseTimeMs: number, requestRate: number): number {
    // Based on Google research: 100ms delay = 1% revenue loss
    const baselineMs = 200;
    const delayMs = Math.max(0, responseTimeMs - baselineMs);
    const revenueLossPercent = (delayMs / 100) * 0.01;
    
    // Estimate hourly revenue based on request rate
    const estimatedHourlyRevenue = (requestRate / 1000) * 10; // $10 per 1000 requests
    
    return estimatedHourlyRevenue * revenueLossPercent;
  }

  isCostEffective(
    scalingCost: number,
    revenueImpact: number,
    confidenceLevel: number
  ): boolean {
    // Adjust threshold based on confidence
    const threshold = 0.5 * confidenceLevel;
    return scalingCost < (revenueImpact * threshold);
  }

  analyzeCurrentCosts(servers: ServerInstance[]): CostAnalysis {
    const runningServers = servers.filter(s => s.status === 'running');
    const hourlyRate = runningServers.reduce((sum, s) => sum + s.cost, 0);
    const projectedDailyCost = hourlyRate * 24;

    // Calculate efficiency: utilization vs cost
    const totalCapacity = runningServers.reduce((sum, s) => sum + s.capacity, 0);
    const efficiencyScore = totalCapacity > 0 ? 
      Math.min(100, (totalCapacity / runningServers.length / 250) * 100) : 0;

    // Estimate potential savings with better optimization
    const potentialSavings = projectedDailyCost * 0.3; // 30% typical optimization

    return {
      hourlyRate,
      projectedDailyCost,
      potentialSavings,
      efficiencyScore
    };
  }

  isWithinBudget(projectedDailyCost: number): boolean {
    return projectedDailyCost <= this.config.maxDailyBudget;
  }
}
EOF

# Create auto-scaler service
print_status "Creating auto-scaler service..."
cat > src/services/autoScaler.ts << 'EOF'
import { 
  ScalingDecision, 
  ServerInstance, 
  AutoScalerConfig,
  SystemMetrics 
} from '../models/types';
import { MetricsCollector } from './metricsCollector';
import { TrafficPredictor } from './trafficPredictor';
import { CostCalculator } from './costCalculator';

export class AutoScaler {
  private config: AutoScalerConfig;
  private metricsCollector: MetricsCollector;
  private trafficPredictor: TrafficPredictor;
  private costCalculator: CostCalculator;
  private scalingHistory: ScalingDecision[] = [];
  private lastScalingTime: Date = new Date(0);
  private serverIdCounter: number = 4;

  constructor(
    config: AutoScalerConfig,
    metricsCollector: MetricsCollector,
    trafficPredictor: TrafficPredictor
  ) {
    this.config = config;
    this.metricsCollector = metricsCollector;
    this.trafficPredictor = trafficPredictor;
    this.costCalculator = new CostCalculator(config);
  }

  async makeScalingDecision(): Promise<ScalingDecision> {
    // Get current metrics
    const currentMetrics = await this.metricsCollector.collectMetrics();
    const currentServers = this.metricsCollector.getCurrentServers();
    const runningServers = currentServers.filter(s => s.status === 'running');
    
    // Calculate current load
    const currentLoad = this.calculateTotalLoad(currentMetrics);
    
    // Get traffic prediction
    const historicalMetrics = this.metricsCollector.getHistoricalMetrics(1);
    const prediction = await this.trafficPredictor.predictNextHour(historicalMetrics);
    
    // Calculate required servers
    const requiredCapacity = prediction.predictedRequestRate / this.config.targetUtilization;
    const requiredServers = Math.ceil(requiredCapacity / this.config.serverCapacity);
    
    // Constrain to min/max bounds
    const targetServers = Math.max(
      this.config.minServers,
      Math.min(this.config.maxServers, requiredServers)
    );
    
    const serversToAdd = targetServers - runningServers.length;
    
    // Check cooldown period
    const timeSinceLastScaling = Date.now() - this.lastScalingTime.getTime();
    const canScale = timeSinceLastScaling > this.config.cooldownPeriod * 1000;
    
    let approved = false;
    let reason = '';
    
    if (!canScale && serversToAdd !== 0) {
      reason = 'In cooldown period';
    } else if (serversToAdd > 0) {
      // Scale up decision
      const scalingCost = this.costCalculator.calculateScalingCost(serversToAdd, 2);
      const avgResponseTime = this.calculateAverageResponseTime(currentMetrics);
      const revenueImpact = this.costCalculator.estimateRevenueImpact(
        avgResponseTime,
        currentLoad
      );
      
      approved = this.costCalculator.isCostEffective(
        scalingCost,
        revenueImpact,
        prediction.confidence
      );
      
      if (approved) {
        reason = `Predicted load increase: ${prediction.predictedRequestRate} req/s, Current: ${Math.floor(currentLoad)} req/s`;
        await this.scaleUp(serversToAdd);
        this.lastScalingTime = new Date();
      } else {
        reason = 'Scale-up not cost effective';
      }
    } else if (serversToAdd < -1) {
      // Scale down decision (only if we have 2+ excess servers)
      approved = true;
      reason = `Predicted load decrease: ${prediction.predictedRequestRate} req/s`;
      await this.scaleDown(Math.abs(serversToAdd));
      this.lastScalingTime = new Date();
    } else {
      reason = 'Current capacity adequate';
      approved = false;
    }
    
    const decision: ScalingDecision = {
      timestamp: new Date(),
      currentServers: runningServers.length,
      targetServers,
      reason,
      predictedLoad: prediction.predictedRequestRate,
      currentLoad,
      costImpact: serversToAdd * this.config.costPerServerHour * 2,
      approved
    };
    
    this.scalingHistory.push(decision);
    if (this.scalingHistory.length > 100) {
      this.scalingHistory = this.scalingHistory.slice(-100);
    }
    
    return decision;
  }

  private calculateTotalLoad(metrics: SystemMetrics[]): number {
    return metrics.reduce((sum, m) => sum + m.requestRate, 0);
  }

  private calculateAverageResponseTime(metrics: SystemMetrics[]): number {
    if (metrics.length === 0) return 200;
    return metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
  }

  private async scaleUp(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      const newServer: ServerInstance = {
        id: `server-${this.serverIdCounter++}`,
        status: 'starting',
        region: 'us-east-1',
        capacity: this.config.serverCapacity,
        cost: this.config.costPerServerHour,
        launchedAt: new Date()
      };
      
      this.metricsCollector.addServer(newServer);
      
      // Simulate server startup time
      setTimeout(() => {
        newServer.status = 'running';
      }, 3000);
    }
  }

  private async scaleDown(count: number): Promise<void> {
    const servers = this.metricsCollector.getCurrentServers();
    const runningServers = servers
      .filter(s => s.status === 'running')
      .sort((a, b) => b.launchedAt.getTime() - a.launchedAt.getTime()); // Remove newest first
    
    const serversToRemove = runningServers.slice(0, Math.min(count, runningServers.length));
    
    serversToRemove.forEach(server => {
      this.metricsCollector.removeServer(server.id);
    });
  }

  getScalingHistory(): ScalingDecision[] {
    return this.scalingHistory;
  }

  getConfig(): AutoScalerConfig {
    return this.config;
  }
}
EOF

# Create API server
print_status "Creating API server..."
cat > src/server.ts << 'EOF'
import express from 'express';
import { metricsCollector, MetricsCollector } from './services/metricsCollector';
import { trafficPredictor, TrafficPredictor } from './services/trafficPredictor';
import { AutoScaler } from './services/autoScaler';
import { AutoScalerConfig } from './models/types';

const app = express();
const PORT = 4000;

const config: AutoScalerConfig = {
  minServers: 2,
  maxServers: 20,
  targetUtilization: 0.70,
  serverCapacity: 250,
  scaleUpThreshold: 0.75,
  scaleDownThreshold: 0.40,
  cooldownPeriod: 180, // 3 minutes
  costPerServerHour: 0.10,
  maxDailyBudget: 50
};

const autoScaler = new AutoScaler(config, metricsCollector, trafficPredictor);

// Start metrics collection
metricsCollector.startCollection(5); // Collect every 5 seconds for demo

// Run auto-scaler every minute
setInterval(async () => {
  await autoScaler.makeScalingDecision();
}, 60000);

app.use(express.json());

app.get('/api/metrics/current', async (req, res) => {
  const metrics = await metricsCollector.collectMetrics();
  res.json(metrics);
});

app.get('/api/metrics/historical', (req, res) => {
  const hours = parseInt(req.query.hours as string) || 1;
  const metrics = metricsCollector.getHistoricalMetrics(hours);
  res.json(metrics);
});

app.get('/api/servers', (req, res) => {
  const servers = metricsCollector.getCurrentServers();
  res.json(servers);
});

app.get('/api/prediction', async (req, res) => {
  const historicalMetrics = metricsCollector.getHistoricalMetrics(1);
  const prediction = await trafficPredictor.predictNextHour(historicalMetrics);
  res.json(prediction);
});

app.get('/api/scaling/history', (req, res) => {
  const history = autoScaler.getScalingHistory();
  res.json(history);
});

app.get('/api/scaling/config', (req, res) => {
  const config = autoScaler.getConfig();
  res.json(config);
});

app.post('/api/scaling/manual', async (req, res) => {
  const decision = await autoScaler.makeScalingDecision();
  res.json(decision);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`✓ API Server running on http://localhost:${PORT}`);
  console.log(`✓ Metrics collection active`);
  console.log(`✓ Auto-scaler running`);
});
EOF

# Create React components
print_status "Creating React dashboard components..."

cat > src/components/MetricsDashboard.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, BarChart, Bar, AreaChart, Area 
} from 'recharts';

interface Metrics {
  timestamp: Date;
  serverId: string;
  cpuUsage: number;
  memoryUsage: number;
  requestRate: number;
  activeConnections: number;
  responseTime: number;
}

interface Server {
  id: string;
  status: string;
  region: string;
  capacity: number;
  cost: number;
}

interface Prediction {
  predictedRequestRate: number;
  confidence: number;
  trend: number;
}

interface ScalingDecision {
  timestamp: Date;
  currentServers: number;
  targetServers: number;
  reason: string;
  approved: boolean;
}

export const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [scalingHistory, setScalingHistory] = useState<ScalingDecision[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, serversRes, predictionRes, scalingRes] = await Promise.all([
        fetch('/api/metrics/historical?hours=0.5'),
        fetch('/api/servers'),
        fetch('/api/prediction'),
        fetch('/api/scaling/history')
      ]);

      setMetrics(await metricsRes.json());
      setServers(await serversRes.json());
      setPrediction(await predictionRes.json());
      setScalingHistory(await scalingRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const aggregateMetrics = () => {
    const timeGroups = new Map<number, Metrics[]>();
    
    metrics.forEach(m => {
      const timeKey = Math.floor(new Date(m.timestamp).getTime() / 30000);
      if (!timeGroups.has(timeKey)) {
        timeGroups.set(timeKey, []);
      }
      timeGroups.get(timeKey)!.push(m);
    });

    return Array.from(timeGroups.values()).map(group => ({
      time: new Date(group[0].timestamp).toLocaleTimeString(),
      avgCpu: group.reduce((sum, m) => sum + m.cpuUsage, 0) / group.length,
      avgMemory: group.reduce((sum, m) => sum + m.memoryUsage, 0) / group.length,
      totalRequests: group.reduce((sum, m) => sum + m.requestRate, 0),
      avgResponseTime: group.reduce((sum, m) => sum + m.responseTime, 0) / group.length
    }));
  };

  const chartData = aggregateMetrics();
  const runningServers = servers.filter(s => s.status === 'running');
  const totalCapacity = runningServers.reduce((sum, s) => sum + s.capacity, 0);
  const currentLoad = metrics.reduce((sum, m) => sum + m.requestRate, 0);
  const utilization = totalCapacity > 0 ? (currentLoad / totalCapacity * 100).toFixed(1) : '0';

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>⚡ Auto-Scaling Dashboard</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Real-time capacity planning and predictive scaling</p>

      {/* Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Active Servers</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#27ae60' }}>{runningServers.length}</div>
          <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '5px' }}>
            Capacity: {totalCapacity} req/s
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Current Load</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3498db' }}>{Math.floor(currentLoad)}</div>
          <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '5px' }}>
            Utilization: {utilization}%
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Predicted Load</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e67e22' }}>
            {prediction?.predictedRequestRate || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '5px' }}>
            Confidence: {((prediction?.confidence || 0) * 100).toFixed(0)}%
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>Hourly Cost</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9b59b6' }}>
            ${(runningServers.length * 0.10).toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '5px' }}>
            Daily: ${(runningServers.length * 0.10 * 24).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Request Rate & Capacity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="totalRequests" stroke="#3498db" fill="#3498db" fillOpacity={0.3} name="Requests/s" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>CPU & Memory Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgCpu" stroke="#e74c3c" name="CPU %" />
              <Line type="monotone" dataKey="avgMemory" stroke="#27ae60" name="Memory %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Response Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgResponseTime" stroke="#9b59b6" name="Response Time (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Server Status</h3>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {servers.map(server => (
              <div key={server.id} style={{ 
                padding: '10px', 
                marginBottom: '10px', 
                backgroundColor: server.status === 'running' ? '#e8f5e9' : '#fff3cd',
                borderRadius: '4px',
                borderLeft: `4px solid ${server.status === 'running' ? '#27ae60' : '#f39c12'}`
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{server.id}</div>
                <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                  Status: {server.status} | Capacity: {server.capacity} req/s | Cost: ${server.cost}/hr
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scaling History */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Scaling Decisions</h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {scalingHistory.slice(-10).reverse().map((decision, idx) => (
            <div key={idx} style={{ 
              padding: '10px', 
              marginBottom: '10px', 
              backgroundColor: decision.approved ? '#e8f5e9' : '#f5f5f5',
              borderRadius: '4px',
              borderLeft: `4px solid ${decision.approved ? '#27ae60' : '#95a5a6'}`
            }}>
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                {new Date(decision.timestamp).toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', marginTop: '5px' }}>
                {decision.currentServers} → {decision.targetServers} servers
                {decision.approved && <span style={{ color: '#27ae60', marginLeft: '10px' }}>✓ Approved</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                {decision.reason}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
EOF

# Create main App component
print_status "Creating App component..."
cat > src/App.tsx << 'EOF'
import React from 'react';
import { MetricsDashboard } from './components/MetricsDashboard';

function App() {
  return <MetricsDashboard />;
}

export default App;
EOF

# Create main.tsx
print_status "Creating main.tsx..."
cat > src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# Create index.html
print_status "Creating index.html..."
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Capacity Planning & Auto-Scaling Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# Create tests
print_status "Creating test files..."
cat > tests/unit/metricsCollector.test.ts << 'EOF'
import { MetricsCollector } from '../../src/services/metricsCollector';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  test('should initialize with 3 servers', () => {
    const servers = collector.getCurrentServers();
    expect(servers.length).toBe(3);
  });

  test('should collect metrics from all servers', async () => {
    const metrics = await collector.collectMetrics();
    expect(metrics.length).toBe(3);
    expect(metrics[0]).toHaveProperty('cpuUsage');
    expect(metrics[0]).toHaveProperty('requestRate');
  });

  test('should add new server', () => {
    const newServer = {
      id: 'test-server',
      status: 'running' as const,
      region: 'us-east-1',
      capacity: 250,
      cost: 0.10,
      launchedAt: new Date()
    };
    collector.addServer(newServer);
    const servers = collector.getCurrentServers();
    expect(servers.length).toBe(4);
  });
});
EOF

cat > tests/unit/trafficPredictor.test.ts << 'EOF'
import { TrafficPredictor } from '../../src/services/trafficPredictor';
import { SystemMetrics } from '../../src/models/types';

describe('TrafficPredictor', () => {
  let predictor: TrafficPredictor;

  beforeEach(() => {
    predictor = new TrafficPredictor();
  });

  test('should predict traffic with minimal data', async () => {
    const metrics: SystemMetrics[] = [
      {
        timestamp: new Date(),
        serverId: 'server-1',
        cpuUsage: 50,
        memoryUsage: 60,
        requestRate: 100,
        activeConnections: 50,
        responseTime: 150
      }
    ];
    
    const prediction = await predictor.predictNextHour(metrics);
    expect(prediction.predictedRequestRate).toBeGreaterThan(0);
    expect(prediction.confidence).toBeGreaterThan(0);
  });
});
EOF

cat > tests/integration/autoScaling.test.ts << 'EOF'
import { AutoScaler } from '../../src/services/autoScaler';
import { MetricsCollector } from '../../src/services/metricsCollector';
import { TrafficPredictor } from '../../src/services/trafficPredictor';
import { AutoScalerConfig } from '../../src/models/types';

describe('AutoScaling Integration', () => {
  let autoScaler: AutoScaler;
  let metricsCollector: MetricsCollector;
  let trafficPredictor: TrafficPredictor;
  let config: AutoScalerConfig;

  beforeEach(() => {
    config = {
      minServers: 2,
      maxServers: 10,
      targetUtilization: 0.70,
      serverCapacity: 250,
      scaleUpThreshold: 0.75,
      scaleDownThreshold: 0.40,
      cooldownPeriod: 60,
      costPerServerHour: 0.10,
      maxDailyBudget: 50
    };

    metricsCollector = new MetricsCollector();
    trafficPredictor = new TrafficPredictor();
    autoScaler = new AutoScaler(config, metricsCollector, trafficPredictor);
  });

  test('should make scaling decision', async () => {
    const decision = await autoScaler.makeScalingDecision();
    expect(decision).toHaveProperty('currentServers');
    expect(decision).toHaveProperty('targetServers');
    expect(decision).toHaveProperty('approved');
  });
});
EOF

# Create Dockerfile
print_status "Creating Dockerfile..."
cat > docker/Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000 4000

CMD ["sh", "-c", "npm run start:metrics & npm run start:predictor & npm run start:scaler & npm run dev"]
EOF

# Create docker-compose.yml
print_status "Creating docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
      - "4000:4000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
EOF

# Create build.sh
print_status "Creating build.sh..."
cat > build.sh << 'EOF'
#!/bin/bash

echo "Building Capacity Planning & Auto-Scaling System..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Run tests
echo "Running tests..."
npm test

# Build TypeScript
echo "Building TypeScript..."
npm run build

echo "✓ Build complete!"
echo ""
echo "Next steps:"
echo "1. Run: ./start.sh"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Open http://localhost:4000/api/health to verify API"
EOF

chmod +x build.sh

# Create start.sh
print_status "Creating start.sh..."
cat > start.sh << 'EOF'
#!/bin/bash

echo "Starting Auto-Scaling System..."

# Start API server in background
echo "Starting API server..."
node -r ts-node/register src/server.ts &
API_PID=$!

# Wait for API to start
sleep 3

# Start frontend
echo "Starting dashboard..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✓ System started!"
echo "✓ Dashboard: http://localhost:3000"
echo "✓ API: http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
wait
EOF

chmod +x start.sh

# Create stop.sh
print_status "Creating stop.sh..."
cat > stop.sh << 'EOF'
#!/bin/bash

echo "Stopping Auto-Scaling System..."

# Kill all node processes
pkill -f "node.*src/server.ts"
pkill -f "vite"

echo "✓ All services stopped"
EOF

chmod +x stop.sh

# Create README
print_status "Creating README..."
cat > README.md << 'EOF'
# Lesson 53: Capacity Planning and Auto-Scaling

## Overview
Intelligent auto-scaling system that predicts traffic patterns and automatically adjusts server capacity while optimizing costs.

## Features
- Real-time metrics collection
- Predictive traffic forecasting using exponential smoothing
- Cost-aware scaling decisions
- Auto-scaling with configurable thresholds
- Real-time dashboard with visualizations

## Quick Start

### Without Docker
```bash
# Install dependencies and build
./build.sh

# Start all services
./start.sh

# Access dashboard
open http://localhost:3000

# Stop all services
./stop.sh
```

### With Docker
```bash
docker-compose up --build
```

## Testing

### Unit Tests
```bash
npm test
```

### Manual Testing
```bash
# Test metrics collection
curl http://localhost:4000/api/metrics/current

# Test traffic prediction
curl http://localhost:4000/api/prediction

# Test scaling decision
curl -X POST http://localhost:4000/api/scaling/manual
```

## Architecture
- **Metrics Collector**: Collects system metrics every 5 seconds
- **Traffic Predictor**: Predicts next-hour traffic using historical data
- **Auto Scaler**: Makes scaling decisions every minute
- **Cost Calculator**: Validates cost-effectiveness of scaling
- **Dashboard**: Real-time visualization of all metrics

## Configuration
Edit `src/server.ts` to modify:
- `minServers`: Minimum number of servers (default: 2)
- `maxServers`: Maximum number of servers (default: 20)
- `targetUtilization`: Target CPU utilization (default: 70%)
- `cooldownPeriod`: Time between scaling actions (default: 180s)
- `maxDailyBudget`: Maximum daily spend (default: $50)

## Success Criteria
✓ System handles 10x traffic spikes automatically
✓ Predictions accurate within 20%
✓ Scaling decisions complete in <3 minutes
✓ Cost optimization reduces idle capacity by 40%
✓ Response time stays under 200ms during scaling

## Lessons Learned
1. Predictive scaling is more effective than reactive
2. Cost awareness prevents runaway infrastructure bills
3. Cooldown periods prevent scaling oscillation
4. Historical data patterns are surprisingly predictable
EOF

# Run build
print_status "Running build..."
cd "$PROJECT_DIR"

# Install dependencies
print_info "Installing dependencies (this may take a few minutes)..."
npm install --silent

# Run tests
print_info "Running tests..."
npm test -- --passWithNoTests

print_status "Setup complete!"
echo ""
echo "=========================================="
echo "📊 Capacity Planning System Ready!"
echo "=========================================="
echo ""
echo "Quick Start:"
echo "  cd $PROJECT_NAME"
echo "  ./start.sh"
echo ""
echo "Then open:"
echo "  Dashboard: http://localhost:3000"
echo "  API: http://localhost:4000"
echo ""
echo "Test endpoints:"
echo "  curl http://localhost:4000/api/health"
echo "  curl http://localhost:4000/api/metrics/current"
echo "  curl http://localhost:4000/api/prediction"
echo ""
echo "To stop: ./stop.sh"
echo "=========================================="
EOF

chmod +x setup.sh

print_status "Setup script created successfully!"