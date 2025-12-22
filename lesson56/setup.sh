#!/bin/bash

# Lesson 56: Cost Management and FinOps - Complete Implementation Script
# This script creates a production-ready FinOps system for tracking and optimizing infrastructure costs

set -e

echo "=========================================="
echo "Twitter Clone - FinOps System Setup"
echo "Lesson 56: Cost Management and FinOps"
echo "=========================================="

# Create project structure
PROJECT_NAME="twitter-finops-system"
echo "Creating project structure..."

mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Create directory structure
mkdir -p src/{services,models,utils,controllers}
mkdir -p src/services/{metering,calculator,allocation,optimization,anomaly,budget,dashboard}
mkdir -p tests/{unit,integration}
mkdir -p config
mkdir -p scripts
mkdir -p public
mkdir -p data

echo "Project structure created successfully!"

# Create package.json
cat > package.json << 'EOF'
{
  "name": "twitter-finops-system",
  "version": "1.0.0",
  "description": "Production-grade FinOps system for Twitter clone infrastructure",
  "main": "src/index.ts",
  "scripts": {
    "dev": "concurrently \"npm run dev:api\" \"npm run dev:ui\"",
    "dev:api": "ts-node-dev --respawn --transpile-only src/index.ts",
    "dev:ui": "vite",
    "build": "tsc && vite build",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "demo": "ts-node src/demo.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.1",
    "axios": "^1.6.5",
    "winston": "^3.11.0",
    "date-fns": "^3.2.0",
    "uuid": "^9.0.1",
    "lodash": "^4.17.21",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.3",
    "lucide-react": "^0.323.0",
    "@tensorflow/tfjs-node": "^4.16.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.11.5",
    "@types/uuid": "^9.0.7",
    "@types/lodash": "^4.14.202",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1",
    "concurrently": "^8.2.2",
    "vite": "^5.0.11",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0"
  }
}
EOF

# Create TypeScript configuration
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF

# Create Vite configuration
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
  },
  build: {
    outDir: 'dist/public'
  }
});
EOF

# Create environment configuration
cat > .env << 'EOF'
NODE_ENV=development
PORT=4000
UI_PORT=3000

# Cost calculation settings
COST_CALCULATION_INTERVAL=10000
ALLOCATION_BATCH_SIZE=1000
OPTIMIZATION_SCAN_INTERVAL=3600000

# Budget settings
DEFAULT_MONTHLY_BUDGET=100000
BUDGET_WARNING_THRESHOLD=0.8
BUDGET_CRITICAL_THRESHOLD=0.9
BUDGET_EXCEEDED_THRESHOLD=1.0

# Anomaly detection settings
ANOMALY_DETECTION_WINDOW=3600
ANOMALY_STDDEV_THRESHOLD=3
ANOMALY_CHECK_INTERVAL=60000

# Database settings (using in-memory for demo)
USE_INMEMORY_DB=true
EOF

# Create main application entry point
cat > src/index.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { MeteringService } from './services/metering/MeteringService';
import { CostCalculator } from './services/calculator/CostCalculator';
import { AllocationEngine } from './services/allocation/AllocationEngine';
import { OptimizationEngine } from './services/optimization/OptimizationEngine';
import { AnomalyDetector } from './services/anomaly/AnomalyDetector';
import { BudgetController } from './services/budget/BudgetController';
import { dashboardRouter, setServices } from './controllers/dashboardController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const meteringService = new MeteringService();
const costCalculator = new CostCalculator();
const allocationEngine = new AllocationEngine();
const optimizationEngine = new OptimizationEngine();
const anomalyDetector = new AnomalyDetector();
const budgetController = new BudgetController();

// Start services
meteringService.start();
costCalculator.start(meteringService);
allocationEngine.start(costCalculator);
optimizationEngine.start(allocationEngine);
anomalyDetector.start(costCalculator);
budgetController.start(allocationEngine);

// Inject services into dashboard controller
setServices({
  meteringService,
  costCalculator,
  allocationEngine,
  optimizationEngine,
  anomalyDetector,
  budgetController
});

// API Routes
app.use('/api', dashboardRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      metering: meteringService.isHealthy(),
      calculator: costCalculator.isHealthy(),
      allocation: allocationEngine.isHealthy(),
      optimization: optimizationEngine.isHealthy(),
      anomaly: anomalyDetector.isHealthy(),
      budget: budgetController.isHealthy()
    }
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`FinOps API server running on port ${PORT}`);
  logger.info(`Dashboard available at http://localhost:${process.env.UI_PORT || 3000}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  meteringService.stop();
  costCalculator.stop();
  allocationEngine.stop();
  optimizationEngine.stop();
  anomalyDetector.stop();
  budgetController.stop();
  process.exit(0);
});
EOF

# Create Logger utility
cat > src/utils/logger.ts << 'EOF'
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});
EOF

# Create Cost Models
cat > src/models/CostModels.ts << 'EOF'
export interface ResourceUsage {
  id: string;
  serviceId: string;
  resourceType: 'compute' | 'storage' | 'network' | 'database' | 'cache';
  timestamp: Date;
  metrics: {
    cpuMilliseconds?: number;
    memoryMBSeconds?: number;
    storageGBHours?: number;
    networkGB?: number;
    apiCalls?: number;
    databaseQueries?: number;
    cacheOperations?: number;
  };
}

export interface CostData {
  id: string;
  timestamp: Date;
  serviceId: string;
  resourceType: string;
  cost: number;
  currency: 'USD';
  breakdown: {
    compute?: number;
    storage?: number;
    network?: number;
    other?: number;
  };
}

export interface AllocationData {
  id: string;
  timestamp: Date;
  costId: string;
  allocations: {
    serviceId: string;
    teamId: string;
    userId?: string;
    featureId?: string;
    percentage: number;
    cost: number;
  }[];
}

export interface OptimizationRecommendation {
  id: string;
  timestamp: Date;
  type: 'rightsizing' | 'reserved_capacity' | 'waste_reduction' | 'architectural';
  serviceId: string;
  title: string;
  description: string;
  currentCost: number;
  projectedCost: number;
  savingsAmount: number;
  savingsPercentage: number;
  confidence: number;
  implementationEffort: 'low' | 'medium' | 'high';
  status: 'identified' | 'validating' | 'ready' | 'implementing' | 'monitoring' | 'completed';
}

export interface CostAnomaly {
  id: string;
  timestamp: Date;
  serviceId: string;
  anomalyType: 'spike' | 'trend' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentCost: number;
  expectedCost: number;
  deviation: number;
  description: string;
  possibleCauses: string[];
}

export interface Budget {
  id: string;
  name: string;
  monthlyLimit: number;
  currentSpend: number;
  forecastedSpend: number;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical' | 'exceeded';
  alerts: {
    enabled: boolean;
    thresholds: number[];
  };
}

export interface PricingModel {
  resourceType: string;
  region: string;
  rates: {
    compute: {
      perCPUHour: number;
      perGBMemoryHour: number;
    };
    storage: {
      perGBMonth: number;
      perGBTransfer: number;
    };
    network: {
      perGBEgress: number;
      perGBCDN: number;
    };
    database: {
      perCPUHour: number;
      perGBStorage: number;
      perIOPS: number;
    };
  };
}
EOF

# Create Metering Service
cat > src/services/metering/MeteringService.ts << 'EOF'
import { v4 as uuidv4 } from 'uuid';
import { ResourceUsage } from '../../models/CostModels';
import { logger } from '../../utils/logger';

export class MeteringService {
  private interval: NodeJS.Timeout | null = null;
  private services: Map<string, any> = new Map();
  private usageData: ResourceUsage[] = [];
  private isRunning = false;

  constructor() {
    this.initializeServices();
  }

  private initializeServices(): void {
    // Simulate multiple services with different resource patterns
    this.services.set('api-gateway', {
      cpuBase: 100,
      memoryBase: 512,
      variability: 0.3
    });
    this.services.set('tweet-service', {
      cpuBase: 200,
      memoryBase: 1024,
      variability: 0.5
    });
    this.services.set('timeline-service', {
      cpuBase: 300,
      memoryBase: 2048,
      variability: 0.4
    });
    this.services.set('media-storage', {
      storageBase: 1000,
      variability: 0.1
    });
    this.services.set('database-primary', {
      cpuBase: 400,
      memoryBase: 4096,
      queriesBase: 1000,
      variability: 0.6
    });
    this.services.set('cache-redis', {
      memoryBase: 8192,
      operationsBase: 5000,
      variability: 0.3
    });
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    const intervalMs = parseInt(process.env.COST_CALCULATION_INTERVAL || '10000');
    
    this.interval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    logger.info('MeteringService started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('MeteringService stopped');
  }

  private collectMetrics(): void {
    const timestamp = new Date();
    
    this.services.forEach((config, serviceId) => {
      const usage: ResourceUsage = {
        id: uuidv4(),
        serviceId,
        resourceType: this.getResourceType(serviceId),
        timestamp,
        metrics: this.generateMetrics(config)
      };

      this.usageData.push(usage);
      
      // Keep only last 1 hour of data
      const oneHourAgo = new Date(Date.now() - 3600000);
      this.usageData = this.usageData.filter(u => u.timestamp > oneHourAgo);
    });

    logger.debug(`Collected metrics for ${this.services.size} services`);
  }

  private getResourceType(serviceId: string): ResourceUsage['resourceType'] {
    if (serviceId.includes('database')) return 'database';
    if (serviceId.includes('storage')) return 'storage';
    if (serviceId.includes('cache')) return 'cache';
    if (serviceId.includes('cdn')) return 'network';
    return 'compute';
  }

  private generateMetrics(config: any): ResourceUsage['metrics'] {
    const variance = () => 1 + (Math.random() - 0.5) * config.variability;
    
    const metrics: ResourceUsage['metrics'] = {};

    if (config.cpuBase) {
      metrics.cpuMilliseconds = Math.floor(config.cpuBase * variance() * 1000);
    }
    if (config.memoryBase) {
      metrics.memoryMBSeconds = Math.floor(config.memoryBase * variance() * 10);
    }
    if (config.storageBase) {
      metrics.storageGBHours = config.storageBase * variance() / 60;
    }
    if (config.queriesBase) {
      metrics.databaseQueries = Math.floor(config.queriesBase * variance());
    }
    if (config.operationsBase) {
      metrics.cacheOperations = Math.floor(config.operationsBase * variance());
    }

    // Add some network usage for all services
    metrics.networkGB = Math.random() * 5;

    return metrics;
  }

  getRecentUsage(minutes: number = 10): ResourceUsage[] {
    const cutoff = new Date(Date.now() - minutes * 60000);
    return this.usageData.filter(u => u.timestamp > cutoff);
  }

  isHealthy(): boolean {
    return this.isRunning && this.usageData.length > 0;
  }
}
EOF

# Create Cost Calculator
cat > src/services/calculator/CostCalculator.ts << 'EOF'
import { v4 as uuidv4 } from 'uuid';
import { CostData, PricingModel } from '../../models/CostModels';
import { MeteringService } from '../metering/MeteringService';
import { logger } from '../../utils/logger';

export class CostCalculator {
  private interval: NodeJS.Timeout | null = null;
  private meteringService: MeteringService | null = null;
  private costData: CostData[] = [];
  private isRunning = false;
  private pricingModel: PricingModel;

  constructor() {
    // Simplified pricing model based on typical cloud provider rates
    this.pricingModel = {
      resourceType: 'standard',
      region: 'us-east-1',
      rates: {
        compute: {
          perCPUHour: 0.05,
          perGBMemoryHour: 0.01
        },
        storage: {
          perGBMonth: 0.023,
          perGBTransfer: 0.09
        },
        network: {
          perGBEgress: 0.09,
          perGBCDN: 0.085
        },
        database: {
          perCPUHour: 0.08,
          perGBStorage: 0.10,
          perIOPS: 0.0001
        }
      }
    };
  }

  start(meteringService: MeteringService): void {
    if (this.isRunning) return;

    this.meteringService = meteringService;
    this.isRunning = true;
    
    const intervalMs = parseInt(process.env.COST_CALCULATION_INTERVAL || '10000');
    
    this.interval = setInterval(() => {
      this.calculateCosts();
    }, intervalMs);

    logger.info('CostCalculator started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('CostCalculator stopped');
  }

  private calculateCosts(): void {
    if (!this.meteringService) return;

    const recentUsage = this.meteringService.getRecentUsage(1);
    
    recentUsage.forEach(usage => {
      const cost = this.calculateResourceCost(usage);
      this.costData.push(cost);
    });

    // Keep only last 24 hours
    const oneDayAgo = new Date(Date.now() - 86400000);
    this.costData = this.costData.filter(c => c.timestamp > oneDayAgo);

    logger.debug(`Calculated costs for ${recentUsage.length} usage records`);
  }

  private calculateResourceCost(usage: any): CostData {
    const metrics = usage.metrics;
    const rates = this.pricingModel.rates;
    
    let computeCost = 0;
    let storageCost = 0;
    let networkCost = 0;

    // Calculate compute costs
    if (metrics.cpuMilliseconds) {
      const cpuHours = metrics.cpuMilliseconds / 1000 / 3600;
      computeCost += cpuHours * rates.compute.perCPUHour;
    }
    if (metrics.memoryMBSeconds) {
      const memoryGBHours = (metrics.memoryMBSeconds / 1024) / 3600;
      computeCost += memoryGBHours * rates.compute.perGBMemoryHour;
    }

    // Calculate storage costs
    if (metrics.storageGBHours) {
      storageCost += metrics.storageGBHours * (rates.storage.perGBMonth / 720);
    }

    // Calculate network costs
    if (metrics.networkGB) {
      networkCost += metrics.networkGB * rates.network.perGBEgress;
    }

    // Database specific costs
    if (usage.resourceType === 'database') {
      if (metrics.databaseQueries) {
        computeCost += metrics.databaseQueries * rates.database.perIOPS;
      }
    }

    const totalCost = computeCost + storageCost + networkCost;

    return {
      id: uuidv4(),
      timestamp: usage.timestamp,
      serviceId: usage.serviceId,
      resourceType: usage.resourceType,
      cost: parseFloat(totalCost.toFixed(6)),
      currency: 'USD',
      breakdown: {
        compute: parseFloat(computeCost.toFixed(6)),
        storage: parseFloat(storageCost.toFixed(6)),
        network: parseFloat(networkCost.toFixed(6)),
        other: 0
      }
    };
  }

  getRecentCosts(minutes: number = 60): CostData[] {
    const cutoff = new Date(Date.now() - minutes * 60000);
    return this.costData.filter(c => c.timestamp > cutoff);
  }

  getTotalCost(minutes: number = 60): number {
    const costs = this.getRecentCosts(minutes);
    return costs.reduce((sum, c) => sum + c.cost, 0);
  }

  getCostsByService(): Map<string, number> {
    const costs = this.getRecentCosts(60);
    const byService = new Map<string, number>();
    
    costs.forEach(cost => {
      const current = byService.get(cost.serviceId) || 0;
      byService.set(cost.serviceId, current + cost.cost);
    });

    return byService;
  }

  isHealthy(): boolean {
    return this.isRunning && this.costData.length > 0;
  }
}
EOF

# Create Allocation Engine
cat > src/services/allocation/AllocationEngine.ts << 'EOF'
import { v4 as uuidv4 } from 'uuid';
import { AllocationData } from '../../models/CostModels';
import { CostCalculator } from '../calculator/CostCalculator';
import { logger } from '../../utils/logger';

export class AllocationEngine {
  private interval: NodeJS.Timeout | null = null;
  private costCalculator: CostCalculator | null = null;
  private allocations: AllocationData[] = [];
  private isRunning = false;
  private teamMapping: Map<string, string> = new Map();

  constructor() {
    this.initializeTeamMapping();
  }

  private initializeTeamMapping(): void {
    // Map services to teams
    this.teamMapping.set('api-gateway', 'platform-team');
    this.teamMapping.set('tweet-service', 'content-team');
    this.teamMapping.set('timeline-service', 'content-team');
    this.teamMapping.set('media-storage', 'media-team');
    this.teamMapping.set('database-primary', 'platform-team');
    this.teamMapping.set('cache-redis', 'platform-team');
  }

  start(costCalculator: CostCalculator): void {
    if (this.isRunning) return;

    this.costCalculator = costCalculator;
    this.isRunning = true;
    
    const intervalMs = parseInt(process.env.COST_CALCULATION_INTERVAL || '10000');
    
    this.interval = setInterval(() => {
      this.allocateCosts();
    }, intervalMs);

    logger.info('AllocationEngine started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('AllocationEngine stopped');
  }

  private allocateCosts(): void {
    if (!this.costCalculator) return;

    const recentCosts = this.costCalculator.getRecentCosts(1);
    
    recentCosts.forEach(cost => {
      const allocation: AllocationData = {
        id: uuidv4(),
        timestamp: cost.timestamp,
        costId: cost.id,
        allocations: this.calculateAllocation(cost)
      };

      this.allocations.push(allocation);
    });

    // Keep only last 24 hours
    const oneDayAgo = new Date(Date.now() - 86400000);
    this.allocations = this.allocations.filter(a => a.timestamp > oneDayAgo);

    logger.debug(`Allocated ${recentCosts.length} cost records`);
  }

  private calculateAllocation(cost: any): AllocationData['allocations'] {
    const teamId = this.teamMapping.get(cost.serviceId) || 'unallocated';
    
    // In a real system, this would use distributed tracing to attribute costs
    // For demo, we do simple direct allocation
    return [{
      serviceId: cost.serviceId,
      teamId,
      featureId: this.mapToFeature(cost.serviceId),
      percentage: 100,
      cost: cost.cost
    }];
  }

  private mapToFeature(serviceId: string): string {
    if (serviceId.includes('tweet')) return 'tweet-posting';
    if (serviceId.includes('timeline')) return 'timeline-generation';
    if (serviceId.includes('media')) return 'media-hosting';
    return 'infrastructure';
  }

  getCostsByTeam(): Map<string, number> {
    const byTeam = new Map<string, number>();
    
    this.allocations.forEach(allocation => {
      allocation.allocations.forEach(alloc => {
        const current = byTeam.get(alloc.teamId) || 0;
        byTeam.set(alloc.teamId, current + alloc.cost);
      });
    });

    return byTeam;
  }

  getCostsByFeature(): Map<string, number> {
    const byFeature = new Map<string, number>();
    
    this.allocations.forEach(allocation => {
      allocation.allocations.forEach(alloc => {
        if (alloc.featureId) {
          const current = byFeature.get(alloc.featureId) || 0;
          byFeature.set(alloc.featureId, current + alloc.cost);
        }
      });
    });

    return byFeature;
  }

  isHealthy(): boolean {
    return this.isRunning && this.allocations.length > 0;
  }
}
EOF

# Create Optimization Engine
cat > src/services/optimization/OptimizationEngine.ts << 'EOF'
import { v4 as uuidv4 } from 'uuid';
import { OptimizationRecommendation } from '../../models/CostModels';
import { AllocationEngine } from '../allocation/AllocationEngine';
import { logger } from '../../utils/logger';

export class OptimizationEngine {
  private interval: NodeJS.Timeout | null = null;
  private allocationEngine: AllocationEngine | null = null;
  private recommendations: OptimizationRecommendation[] = [];
  private isRunning = false;

  start(allocationEngine: AllocationEngine): void {
    if (this.isRunning) return;

    this.allocationEngine = allocationEngine;
    this.isRunning = true;
    
    const intervalMs = parseInt(process.env.OPTIMIZATION_SCAN_INTERVAL || '3600000');
    
    this.interval = setInterval(() => {
      this.generateRecommendations();
    }, intervalMs);

    // Generate initial recommendations
    setTimeout(() => this.generateRecommendations(), 5000);

    logger.info('OptimizationEngine started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('OptimizationEngine stopped');
  }

  private generateRecommendations(): void {
    if (!this.allocationEngine) return;

    const byTeam = this.allocationEngine.getCostsByTeam();
    const byFeature = this.allocationEngine.getCostsByFeature();

    // Clear old recommendations in 'identified' state
    this.recommendations = this.recommendations.filter(r => r.status !== 'identified');

    // Generate different types of recommendations
    this.generateRightSizingRecommendations(byTeam);
    this.generateReservedCapacityRecommendations(byTeam);
    this.generateWasteReductionRecommendations();
    this.generateArchitecturalRecommendations(byFeature);

    logger.info(`Generated ${this.recommendations.length} optimization recommendations`);
  }

  private generateRightSizingRecommendations(costsByTeam: Map<string, number>): void {
    const services = ['database-primary', 'cache-redis'];
    
    services.forEach(serviceId => {
      const currentCost = this.estimateServiceCost(serviceId);
      const savingsPercent = 0.20 + Math.random() * 0.15; // 20-35% savings
      const projectedCost = currentCost * (1 - savingsPercent);

      this.recommendations.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: 'rightsizing',
        serviceId,
        title: `Right-size ${serviceId} instances`,
        description: `Analysis shows ${serviceId} running at ${Math.floor(15 + Math.random() * 20)}% average utilization. Recommend downsizing to smaller instance type.`,
        currentCost: parseFloat(currentCost.toFixed(2)),
        projectedCost: parseFloat(projectedCost.toFixed(2)),
        savingsAmount: parseFloat((currentCost - projectedCost).toFixed(2)),
        savingsPercentage: parseFloat((savingsPercent * 100).toFixed(1)),
        confidence: 0.85 + Math.random() * 0.1,
        implementationEffort: 'low',
        status: 'identified'
      });
    });
  }

  private generateReservedCapacityRecommendations(costsByTeam: Map<string, number>): void {
    const totalCost = Array.from(costsByTeam.values()).reduce((sum, cost) => sum + cost, 0);
    const monthlyCost = totalCost * 30 * 24; // Convert hourly to monthly
    const savingsPercent = 0.40; // 40% savings with 3-year commitment

    this.recommendations.push({
      id: uuidv4(),
      timestamp: new Date(),
      type: 'reserved_capacity',
      serviceId: 'all-services',
      title: 'Purchase reserved capacity for stable workloads',
      description: 'Commit to 3-year reserved instances for predictable baseline capacity. Current on-demand spending shows stable pattern suitable for reservations.',
      currentCost: parseFloat((monthlyCost * 36).toFixed(2)), // 3-year total
      projectedCost: parseFloat((monthlyCost * 36 * (1 - savingsPercent)).toFixed(2)),
      savingsAmount: parseFloat((monthlyCost * 36 * savingsPercent).toFixed(2)),
      savingsPercentage: 40,
      confidence: 0.95,
      implementationEffort: 'medium',
      status: 'identified'
    });
  }

  private generateWasteReductionRecommendations(): void {
    const wasteSources = [
      {
        serviceId: 'staging-environment',
        title: 'Shutdown staging environment during off-hours',
        description: 'Staging environment runs 24/7 but only used during business hours (9 AM - 6 PM weekdays). Automate shutdown to save 70% of costs.',
        monthlySaving: 4100
      },
      {
        serviceId: 'old-snapshots',
        title: 'Delete outdated database snapshots',
        description: 'Found 47 database snapshots older than 90 days. Retention policy only requires 30 days. Delete old snapshots.',
        monthlySaving: 890
      }
    ];

    wasteSources.forEach(waste => {
      this.recommendations.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: 'waste_reduction',
        serviceId: waste.serviceId,
        title: waste.title,
        description: waste.description,
        currentCost: waste.monthlySaving,
        projectedCost: 0,
        savingsAmount: waste.monthlySaving,
        savingsPercentage: 100,
        confidence: 0.99,
        implementationEffort: 'low',
        status: 'identified'
      });
    });
  }

  private generateArchitecturalRecommendations(costsByFeature: Map<string, number>): void {
    const timelineCost = costsByFeature.get('timeline-generation') || 0;
    
    if (timelineCost > 100) { // Only recommend if significant cost
      const savingsPercent = 0.30;
      const savingsAmount = timelineCost * savingsPercent;

      this.recommendations.push({
        id: uuidv4(),
        timestamp: new Date(),
        type: 'architectural',
        serviceId: 'timeline-service',
        title: 'Implement materialized timeline caching',
        description: 'Timeline generation accounts for significant database load. Implement Redis-based materialized timeline cache to reduce database queries by 70%.',
        currentCost: parseFloat((timelineCost * 30 * 24).toFixed(2)), // Monthly
        projectedCost: parseFloat((timelineCost * 30 * 24 * (1 - savingsPercent)).toFixed(2)),
        savingsAmount: parseFloat((savingsAmount * 30 * 24).toFixed(2)),
        savingsPercentage: parseFloat((savingsPercent * 100).toFixed(1)),
        confidence: 0.78,
        implementationEffort: 'high',
        status: 'identified'
      });
    }
  }

  private estimateServiceCost(serviceId: string): number {
    // Estimate current hourly cost for a service
    const baseCosts: Record<string, number> = {
      'database-primary': 15.5,
      'cache-redis': 8.2,
      'api-gateway': 5.1,
      'tweet-service': 6.8,
      'timeline-service': 7.3,
      'media-storage': 12.4
    };
    return baseCosts[serviceId] || 5.0;
  }

  getRecommendations(): OptimizationRecommendation[] {
    return this.recommendations.sort((a, b) => b.savingsAmount - a.savingsAmount);
  }

  getTotalSavingsOpportunity(): number {
    return this.recommendations
      .filter(r => r.status === 'identified')
      .reduce((sum, r) => sum + r.savingsAmount, 0);
  }

  isHealthy(): boolean {
    return this.isRunning;
  }
}
EOF

# Create Anomaly Detector
cat > src/services/anomaly/AnomalyDetector.ts << 'EOF'
import { v4 as uuidv4 } from 'uuid';
import { CostAnomaly } from '../../models/CostModels';
import { CostCalculator } from '../calculator/CostCalculator';
import { logger } from '../../utils/logger';

export class AnomalyDetector {
  private interval: NodeJS.Timeout | null = null;
  private costCalculator: CostCalculator | null = null;
  private anomalies: CostAnomaly[] = [];
  private isRunning = false;
  private costHistory: Map<string, number[]> = new Map();

  start(costCalculator: CostCalculator): void {
    if (this.isRunning) return;

    this.costCalculator = costCalculator;
    this.isRunning = true;
    
    const intervalMs = parseInt(process.env.ANOMALY_CHECK_INTERVAL || '60000');
    
    this.interval = setInterval(() => {
      this.detectAnomalies();
    }, intervalMs);

    logger.info('AnomalyDetector started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('AnomalyDetector stopped');
  }

  private detectAnomalies(): void {
    if (!this.costCalculator) return;

    const costsByService = this.costCalculator.getCostsByService();
    
    costsByService.forEach((cost, serviceId) => {
      this.updateHistory(serviceId, cost);
      
      const anomaly = this.checkForAnomaly(serviceId, cost);
      if (anomaly) {
        this.anomalies.push(anomaly);
        logger.warn(`Cost anomaly detected: ${anomaly.description}`);
      }
    });

    // Keep only last 24 hours of anomalies
    const oneDayAgo = new Date(Date.now() - 86400000);
    this.anomalies = this.anomalies.filter(a => a.timestamp > oneDayAgo);
  }

  private updateHistory(serviceId: string, cost: number): void {
    if (!this.costHistory.has(serviceId)) {
      this.costHistory.set(serviceId, []);
    }
    
    const history = this.costHistory.get(serviceId)!;
    history.push(cost);
    
    // Keep only last 60 data points
    if (history.length > 60) {
      history.shift();
    }
  }

  private checkForAnomaly(serviceId: string, currentCost: number): CostAnomaly | null {
    const history = this.costHistory.get(serviceId);
    if (!history || history.length < 10) return null; // Need baseline

    const stats = this.calculateStats(history);
    const zScore = (currentCost - stats.mean) / stats.stdDev;
    const threshold = parseInt(process.env.ANOMALY_STDDEV_THRESHOLD || '3');

    if (Math.abs(zScore) > threshold) {
      const deviation = ((currentCost - stats.mean) / stats.mean) * 100;
      
      return {
        id: uuidv4(),
        timestamp: new Date(),
        serviceId,
        anomalyType: zScore > 0 ? 'spike' : 'trend',
        severity: this.calculateSeverity(Math.abs(zScore)),
        currentCost: parseFloat(currentCost.toFixed(4)),
        expectedCost: parseFloat(stats.mean.toFixed(4)),
        deviation: parseFloat(deviation.toFixed(1)),
        description: `${serviceId} cost ${zScore > 0 ? 'spike' : 'drop'} detected: ${Math.abs(deviation).toFixed(1)}% ${zScore > 0 ? 'above' : 'below'} expected`,
        possibleCauses: this.identifyPossibleCauses(serviceId, deviation)
      };
    }

    return null;
  }

  private calculateStats(data: number[]): { mean: number; stdDev: number } {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev };
  }

  private calculateSeverity(zScore: number): CostAnomaly['severity'] {
    if (zScore > 5) return 'critical';
    if (zScore > 4) return 'high';
    if (zScore > 3) return 'medium';
    return 'low';
  }

  private identifyPossibleCauses(serviceId: string, deviation: number): string[] {
    const causes: string[] = [];
    
    if (deviation > 0) {
      causes.push('Traffic spike or viral content');
      causes.push('Misconfigured auto-scaling');
      causes.push('Resource leak or performance regression');
      if (serviceId.includes('database')) {
        causes.push('Inefficient queries or missing indexes');
      }
    } else {
      causes.push('Service degradation or outage');
      causes.push('Configuration change reducing usage');
    }
    
    return causes;
  }

  getRecentAnomalies(hours: number = 24): CostAnomaly[] {
    const cutoff = new Date(Date.now() - hours * 3600000);
    return this.anomalies.filter(a => a.timestamp > cutoff);
  }

  isHealthy(): boolean {
    return this.isRunning;
  }
}
EOF

# Create Budget Controller
cat > src/services/budget/BudgetController.ts << 'EOF'
import { v4 as uuidv4 } from 'uuid';
import { Budget } from '../../models/CostModels';
import { AllocationEngine } from '../allocation/AllocationEngine';
import { logger } from '../../utils/logger';

export class BudgetController {
  private interval: NodeJS.Timeout | null = null;
  private allocationEngine: AllocationEngine | null = null;
  private budgets: Map<string, Budget> = new Map();
  private isRunning = false;

  constructor() {
    this.initializeBudgets();
  }

  private initializeBudgets(): void {
    const monthlyBudget = parseInt(process.env.DEFAULT_MONTHLY_BUDGET || '100000');
    
    // Company-wide budget
    this.budgets.set('company', {
      id: 'company',
      name: 'Company Total',
      monthlyLimit: monthlyBudget,
      currentSpend: 0,
      forecastedSpend: 0,
      threshold: 0.8,
      status: 'healthy',
      alerts: {
        enabled: true,
        thresholds: [0.5, 0.8, 0.9, 1.0]
      }
    });

    // Team budgets
    const teams = ['platform-team', 'content-team', 'media-team'];
    teams.forEach(team => {
      this.budgets.set(team, {
        id: team,
        name: team.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        monthlyLimit: monthlyBudget / teams.length,
        currentSpend: 0,
        forecastedSpend: 0,
        threshold: 0.8,
        status: 'healthy',
        alerts: {
          enabled: true,
          thresholds: [0.8, 0.9, 1.0]
        }
      });
    });
  }

  start(allocationEngine: AllocationEngine): void {
    if (this.isRunning) return;

    this.allocationEngine = allocationEngine;
    this.isRunning = true;
    
    const intervalMs = parseInt(process.env.COST_CALCULATION_INTERVAL || '10000');
    
    this.interval = setInterval(() => {
      this.updateBudgets();
    }, intervalMs);

    logger.info('BudgetController started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('BudgetController stopped');
  }

  private updateBudgets(): void {
    if (!this.allocationEngine) return;

    const costsByTeam = this.allocationEngine.getCostsByTeam();
    
    // Update team budgets
    costsByTeam.forEach((cost, teamId) => {
      const budget = this.budgets.get(teamId);
      if (budget) {
        // Convert hourly cost to monthly projection
        const monthlyCost = cost * 24 * 30;
        budget.currentSpend += cost;
        budget.forecastedSpend = monthlyCost;
        budget.status = this.calculateBudgetStatus(budget);
        
        if (budget.status !== 'healthy') {
          logger.warn(`Budget alert: ${budget.name} is ${budget.status}`);
        }
      }
    });

    // Update company budget
    const companyBudget = this.budgets.get('company');
    if (companyBudget) {
      const totalCost = Array.from(costsByTeam.values()).reduce((sum, cost) => sum + cost, 0);
      companyBudget.currentSpend += totalCost;
      companyBudget.forecastedSpend = totalCost * 24 * 30;
      companyBudget.status = this.calculateBudgetStatus(companyBudget);
    }
  }

  private calculateBudgetStatus(budget: Budget): Budget['status'] {
    const utilization = budget.forecastedSpend / budget.monthlyLimit;
    
    const warningThreshold = parseFloat(process.env.BUDGET_WARNING_THRESHOLD || '0.8');
    const criticalThreshold = parseFloat(process.env.BUDGET_CRITICAL_THRESHOLD || '0.9');
    const exceededThreshold = parseFloat(process.env.BUDGET_EXCEEDED_THRESHOLD || '1.0');
    
    if (utilization >= exceededThreshold) return 'exceeded';
    if (utilization >= criticalThreshold) return 'critical';
    if (utilization >= warningThreshold) return 'warning';
    return 'healthy';
  }

  getBudgets(): Budget[] {
    return Array.from(this.budgets.values());
  }

  getBudget(id: string): Budget | undefined {
    return this.budgets.get(id);
  }

  isHealthy(): boolean {
    return this.isRunning && this.budgets.size > 0;
  }
}
EOF

# Create Dashboard Controller
cat > src/controllers/dashboardController.ts << 'EOF'
import { Router } from 'express';

export const dashboardRouter = Router();

// These will be injected from main app
let services: any = {};

export function setServices(svc: any) {
  services = svc;
}

dashboardRouter.get('/dashboard/summary', (req, res) => {
  try {
    if (!services.costCalculator || !services.allocationEngine || !services.budgetController) {
      return res.status(503).json({ error: 'Services not initialized' });
    }

    const hourlyCost = services.costCalculator.getTotalCost(60);
    const dailyCost = hourlyCost * 24;
    const monthlyCost = dailyCost * 30;

    const costsByService = services.costCalculator.getCostsByService();
    const costsByTeam = services.allocationEngine.getCostsByTeam();
    const budgets = services.budgetController.getBudgets();

    const summary = {
      timestamp: new Date().toISOString(),
      totalCost: {
        hourly: parseFloat(hourlyCost.toFixed(2)),
        daily: parseFloat(dailyCost.toFixed(2)),
        monthly: parseFloat(monthlyCost.toFixed(2))
      },
      costsByService: Object.fromEntries(costsByService),
      costsByTeam: Object.fromEntries(costsByTeam),
      budgetStatus: budgets.map(b => ({
        id: b.id,
        name: b.name,
        limit: b.monthlyLimit,
        spent: b.currentSpend,
        forecasted: b.forecastedSpend,
        status: b.status
      }))
    };

    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get dashboard summary', message: error.message });
  }
});

dashboardRouter.get('/costs/current', (req, res) => {
  try {
    if (!services.costCalculator) {
      return res.status(503).json({ error: 'Cost calculator not initialized' });
    }

    const costs = services.costCalculator.getRecentCosts(60);
    res.json({
      timestamp: new Date().toISOString(),
      costs: costs.map(c => ({
        id: c.id,
        timestamp: c.timestamp,
        serviceId: c.serviceId,
        resourceType: c.resourceType,
        cost: c.cost,
        breakdown: c.breakdown
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get current costs', message: error.message });
  }
});

dashboardRouter.get('/optimizations', (req, res) => {
  try {
    if (!services.optimizationEngine) {
      return res.status(503).json({ error: 'Optimization engine not initialized' });
    }

    const recommendations = services.optimizationEngine.getRecommendations();
    const totalSavings = services.optimizationEngine.getTotalSavingsOpportunity();

    res.json({
      recommendations: recommendations.map(r => ({
        id: r.id,
        title: r.title,
        type: r.type,
        savings: r.savingsAmount,
        savingsPercentage: r.savingsPercentage,
        confidence: r.confidence,
        implementationEffort: r.implementationEffort,
        status: r.status
      })),
      totalSavings: parseFloat(totalSavings.toFixed(2))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get optimizations', message: error.message });
  }
});

dashboardRouter.get('/anomalies', (req, res) => {
  try {
    if (!services.anomalyDetector) {
      return res.status(503).json({ error: 'Anomaly detector not initialized' });
    }

    const anomalies = services.anomalyDetector.getRecentAnomalies(24);
    res.json({
      anomalies: anomalies.map(a => ({
        id: a.id,
        timestamp: a.timestamp,
        service: a.serviceId,
        severity: a.severity,
        deviation: a.deviation,
        description: a.description,
        possibleCauses: a.possibleCauses
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get anomalies', message: error.message });
  }
});

dashboardRouter.get('/budgets', (req, res) => {
  try {
    if (!services.budgetController) {
      return res.status(503).json({ error: 'Budget controller not initialized' });
    }

    const budgets = services.budgetController.getBudgets();
    res.json({
      budgets: budgets.map(b => ({
        id: b.id,
        name: b.name,
        limit: b.monthlyLimit,
        spent: b.currentSpend,
        forecasted: b.forecastedSpend,
        status: b.status
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get budgets', message: error.message });
  }
});
EOF

# Create React Dashboard UI
cat > src/Dashboard.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Target, Zap, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface CostData {
  timestamp: string;
  cost: number;
  service: string;
}

interface BudgetData {
  id: string;
  name: string;
  limit: number;
  spent: number;
  forecasted: number;
  status: string;
}

interface Recommendation {
  id: string;
  title: string;
  type: string;
  savings: number;
  confidence: number;
}

interface Anomaly {
  id: string;
  service: string;
  severity: string;
  deviation: number;
  description: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Dashboard() {
  const [costData, setCostData] = useState<CostData[]>([]);
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [totalCost, setTotalCost] = useState({ hourly: 0, daily: 0, monthly: 0 });

  useEffect(() => {
    // Fetch initial data
    fetchDashboardData();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard summary
      const summaryRes = await fetch('/api/dashboard/summary');
      if (summaryRes.ok) {
        const summary = await summaryRes.json();
        setTotalCost(summary.totalCost);
        setBudgets(summary.budgetStatus || []);
      }

      // Fetch current costs
      const costsRes = await fetch('/api/costs/current');
      if (costsRes.ok) {
        const costsData = await costsRes.json();
        const formattedCosts: CostData[] = costsData.costs.map((c: any) => ({
          timestamp: c.timestamp,
          cost: c.cost,
          service: c.serviceId
        }));
        setCostData(formattedCosts);
      }

      // Fetch optimizations
      const optimizationsRes = await fetch('/api/optimizations');
      if (optimizationsRes.ok) {
        const optData = await optimizationsRes.json();
        setRecommendations(optData.recommendations || []);
      }

      // Fetch anomalies
      const anomaliesRes = await fetch('/api/anomalies');
      if (anomaliesRes.ok) {
        const anomaliesData = await anomaliesRes.json();
        setAnomalies(anomaliesData.anomalies || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const aggregateCostsByService = () => {
    const byService = new Map<string, number>();
    costData.forEach(d => {
      const current = byService.get(d.service) || 0;
      byService.set(d.service, current + d.cost);
    });
    
    return Array.from(byService.entries()).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }));
  };

  const getCostTrend = () => {
    const byMinute = new Map<string, number>();
    costData.forEach(d => {
      const minute = d.timestamp.substring(0, 16);
      const current = byMinute.get(minute) || 0;
      byMinute.set(minute, current + d.cost);
    });
    
    return Array.from(byMinute.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-20)
      .map(([time, cost]) => ({
        time: new Date(time).toLocaleTimeString(),
        cost: parseFloat(cost.toFixed(3))
      }));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'bg-red-500';
      case 'critical': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            FinOps Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time infrastructure cost tracking and optimization
          </p>
        </div>

        {/* Cost Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Hourly Cost</h3>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ${totalCost.hourly.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Current burn rate</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Daily Projection</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ${totalCost.daily.toFixed(0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">At current rate</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Monthly Forecast</h3>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              ${totalCost.monthly.toFixed(0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Forecasted spend</p>
          </div>
        </div>

        {/* Cost Trend Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Cost Trend (Last 20 Minutes)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getCostTrend()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cost by Service */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Cost by Service
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={aggregateCostsByService()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: $${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {aggregateCostsByService().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Budget Status
            </h2>
            <div className="space-y-4">
              {budgets.map(budget => {
                const utilization = (budget.forecasted / budget.limit) * 100;
                return (
                  <div key={budget.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {budget.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        {utilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${getStatusColor(budget.status)} h-3 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>Spent: ${budget.spent.toLocaleString()}</span>
                      <span>Limit: ${budget.limit.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Optimization Recommendations */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Optimization Opportunities
            </h2>
            <span className="text-sm text-green-600 font-medium">
              Total Savings: ${recommendations.reduce((sum, r) => sum + r.savings, 0).toLocaleString()}/month
            </span>
          </div>
          <div className="space-y-3">
            {recommendations.map(rec => (
              <div key={rec.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{rec.title}</p>
                    <p className="text-sm text-gray-600">
                      {rec.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} • 
                      Confidence: {(rec.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ${rec.savings.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">per month</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anomaly Alerts */}
        {anomalies.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              Cost Anomalies Detected
            </h2>
            <div className="space-y-3">
              {anomalies.map(anomaly => (
                <div key={anomaly.id} className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{anomaly.service}</p>
                      <p className="text-sm mt-1">{anomaly.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
EOF

# Create main UI entry point
cat > src/main.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Dashboard } from './Dashboard';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>
);
EOF

# Create CSS
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
EOF

# Create HTML template
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Twitter FinOps Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# Create demo script
cat > src/demo.ts << 'EOF'
import { MeteringService } from './services/metering/MeteringService';
import { CostCalculator } from './services/calculator/CostCalculator';
import { AllocationEngine } from './services/allocation/AllocationEngine';
import { OptimizationEngine } from './services/optimization/OptimizationEngine';
import { AnomalyDetector } from './services/anomaly/AnomalyDetector';
import { BudgetController } from './services/budget/BudgetController';
import { logger } from './utils/logger';

async function runDemo() {
  logger.info('='.repeat(60));
  logger.info('Twitter FinOps System - Demonstration');
  logger.info('='.repeat(60));

  // Initialize services
  const meteringService = new MeteringService();
  const costCalculator = new CostCalculator();
  const allocationEngine = new AllocationEngine();
  const optimizationEngine = new OptimizationEngine();
  const anomalyDetector = new AnomalyDetector();
  const budgetController = new BudgetController();

  // Start services
  meteringService.start();
  costCalculator.start(meteringService);
  allocationEngine.start(costCalculator);
  optimizationEngine.start(allocationEngine);
  anomalyDetector.start(costCalculator);
  budgetController.start(allocationEngine);

  // Wait for data collection
  logger.info('\\nCollecting metrics for 30 seconds...\\n');
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Display results
  logger.info('\\n' + '='.repeat(60));
  logger.info('Cost Summary');
  logger.info('='.repeat(60));
  
  const totalCost = costCalculator.getTotalCost(60);
  const hourlyCost = totalCost;
  const dailyCost = hourlyCost * 24;
  const monthlyCost = dailyCost * 30;
  
  logger.info(`Hourly Cost:   $${hourlyCost.toFixed(2)}`);
  logger.info(`Daily Cost:    $${dailyCost.toFixed(2)}`);
  logger.info(`Monthly Cost:  $${monthlyCost.toFixed(2)}`);

  logger.info('\\n' + '='.repeat(60));
  logger.info('Cost by Service');
  logger.info('='.repeat(60));
  
  const costsByService = costCalculator.getCostsByService();
  costsByService.forEach((cost, service) => {
    logger.info(`${service.padEnd(25)} $${cost.toFixed(4)}/hour`);
  });

  logger.info('\\n' + '='.repeat(60));
  logger.info('Cost by Team');
  logger.info('='.repeat(60));
  
  const costsByTeam = allocationEngine.getCostsByTeam();
  costsByTeam.forEach((cost, team) => {
    logger.info(`${team.padEnd(25)} $${cost.toFixed(4)}/hour`);
  });

  logger.info('\\n' + '='.repeat(60));
  logger.info('Optimization Recommendations');
  logger.info('='.repeat(60));
  
  const recommendations = optimizationEngine.getRecommendations();
  logger.info(`Found ${recommendations.length} optimization opportunities\\n`);
  
  recommendations.forEach((rec, idx) => {
    logger.info(`${idx + 1}. ${rec.title}`);
    logger.info(`   Type: ${rec.type}`);
    logger.info(`   Savings: $${rec.savingsAmount.toFixed(2)}/month (${rec.savingsPercentage}%)`);
    logger.info(`   Confidence: ${(rec.confidence * 100).toFixed(0)}%`);
    logger.info('');
  });

  const totalSavings = optimizationEngine.getTotalSavingsOpportunity();
  logger.info(`Total Monthly Savings Opportunity: $${totalSavings.toFixed(2)}`);

  logger.info('\\n' + '='.repeat(60));
  logger.info('Cost Anomalies');
  logger.info('='.repeat(60));
  
  const anomalies = anomalyDetector.getRecentAnomalies(24);
  if (anomalies.length === 0) {
    logger.info('No anomalies detected');
  } else {
    anomalies.forEach((anomaly, idx) => {
      logger.info(`${idx + 1}. ${anomaly.description}`);
      logger.info(`   Severity: ${anomaly.severity}`);
      logger.info(`   Deviation: ${anomaly.deviation.toFixed(1)}%`);
      logger.info('');
    });
  }

  logger.info('\\n' + '='.repeat(60));
  logger.info('Budget Status');
  logger.info('='.repeat(60));
  
  const budgets = budgetController.getBudgets();
  budgets.forEach(budget => {
    const utilization = (budget.forecastedSpend / budget.monthlyLimit) * 100;
    logger.info(`${budget.name}`);
    logger.info(`  Monthly Limit: $${budget.monthlyLimit.toLocaleString()}`);
    logger.info(`  Forecasted:    $${budget.forecastedSpend.toFixed(2)} (${utilization.toFixed(1)}%)`);
    logger.info(`  Status:        ${budget.status.toUpperCase()}`);
    logger.info('');
  });

  logger.info('\\n' + '='.repeat(60));
  logger.info('Demo Complete - Dashboard available at http://localhost:3000');
  logger.info('='.repeat(60));
  logger.info('\\nPress Ctrl+C to stop services\\n');
}

runDemo().catch(console.error);
EOF

# Create test files
cat > tests/unit/metering.test.ts << 'EOF'
import { MeteringService } from '../../src/services/metering/MeteringService';

describe('MeteringService', () => {
  let service: MeteringService;

  beforeEach(() => {
    service = new MeteringService();
  });

  afterEach(() => {
    service.stop();
  });

  test('should start and collect metrics', async () => {
    service.start();
    
    // Wait for at least one collection cycle
    await new Promise(resolve => setTimeout(resolve, 11000));
    
    const usage = service.getRecentUsage(1);
    expect(usage.length).toBeGreaterThan(0);
  });

  test('should track multiple services', async () => {
    service.start();
    await new Promise(resolve => setTimeout(resolve, 11000));
    
    const usage = service.getRecentUsage(1);
    const serviceIds = new Set(usage.map(u => u.serviceId));
    
    expect(serviceIds.size).toBeGreaterThan(3);
  });

  test('should include required metrics', async () => {
    service.start();
    await new Promise(resolve => setTimeout(resolve, 11000));
    
    const usage = service.getRecentUsage(1);
    const sample = usage[0];
    
    expect(sample).toHaveProperty('id');
    expect(sample).toHaveProperty('serviceId');
    expect(sample).toHaveProperty('resourceType');
    expect(sample).toHaveProperty('metrics');
  });
});
EOF

cat > tests/unit/calculator.test.ts << 'EOF'
import { MeteringService } from '../../src/services/metering/MeteringService';
import { CostCalculator } from '../../src/services/calculator/CostCalculator';

describe('CostCalculator', () => {
  let metering: MeteringService;
  let calculator: CostCalculator;

  beforeEach(() => {
    metering = new MeteringService();
    calculator = new CostCalculator();
  });

  afterEach(() => {
    metering.stop();
    calculator.stop();
  });

  test('should calculate costs from metrics', async () => {
    metering.start();
    calculator.start(metering);
    
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const costs = calculator.getRecentCosts(1);
    expect(costs.length).toBeGreaterThan(0);
  });

  test('should include cost breakdown', async () => {
    metering.start();
    calculator.start(metering);
    
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const costs = calculator.getRecentCosts(1);
    const sample = costs[0];
    
    expect(sample.breakdown).toHaveProperty('compute');
    expect(sample.breakdown).toHaveProperty('storage');
    expect(sample.breakdown).toHaveProperty('network');
  });

  test('should aggregate costs correctly', async () => {
    metering.start();
    calculator.start(metering);
    
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const total = calculator.getTotalCost(1);
    expect(total).toBeGreaterThan(0);
  });
});
EOF

# Create jest configuration
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/Dashboard.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testTimeout: 30000
};
EOF

# Create Tailwind config
cat > tailwind.config.js << 'EOF'
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Create postcss config
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
coverage/
.env.local
*.log
.DS_Store
EOF

# Create build script
cat > build.sh << 'EOF'
#!/bin/bash

echo "Building Twitter FinOps System..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Compile TypeScript
echo "Compiling TypeScript..."
npm run build

echo "Build complete!"
EOF

chmod +x build.sh

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash

echo "Starting Twitter FinOps System..."

# Start API server in background
echo "Starting API server..."
npm run dev:api &
API_PID=$!

# Wait for API to be ready
sleep 3

# Start UI
echo "Starting dashboard UI..."
npm run dev:ui &
UI_PID=$!

echo ""
echo "====================================="
echo "Twitter FinOps System Running"
echo "====================================="
echo "API Server: http://localhost:4000"
echo "Dashboard:  http://localhost:3000"
echo "====================================="
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait $API_PID $UI_PID
EOF

chmod +x start.sh

# Create stop script
cat > stop.sh << 'EOF'
#!/bin/bash

echo "Stopping Twitter FinOps System..."

# Kill processes on ports 3000 and 4000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true

echo "All services stopped."
EOF

chmod +x stop.sh

# Create Docker files
cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000 4000

CMD ["npm", "run", "dev"]
EOF

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  finops-api:
    build: .
    ports:
      - "4000:4000"
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=4000
      - UI_PORT=3000
    volumes:
      - ./src:/app/src
      - ./data:/app/data
EOF

cat > .dockerignore << 'EOF'
node_modules
dist
coverage
.env.local
*.log
.git
EOF

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Project structure created successfully."
echo "Next steps:"
echo ""
echo "1. Run: ./build.sh"
echo "2. Run: ./start.sh"
echo "3. Open: http://localhost:3000"
echo ""
echo "Or with Docker:"
echo "1. Run: docker-compose up --build"
echo "2. Open: http://localhost:3000"
echo ""
echo "=========================================="