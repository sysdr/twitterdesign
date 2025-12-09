#!/bin/bash

# Lesson 48: Mathematical Modeling Validation - Complete Implementation
# This script creates a full model validation system for Twitter clone

set -e

PROJECT_NAME="twitter-model-validation"
BASE_DIR=$(pwd)/$PROJECT_NAME

echo "=========================================="
echo "Twitter Model Validation System Setup"
echo "=========================================="

# Create project structure
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

mkdir -p {backend/{src/{models,services,routes,types,utils},tests},frontend/{src/{components,services,types,utils,hooks},public}}

# Backend package.json
cat > backend/package.json << 'EOF'
{
  "name": "twitter-model-validation-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "ws": "^8.17.0",
    "simple-statistics": "^7.8.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/ws": "^8.5.10",
    "@types/node": "^20.12.12",
    "typescript": "^5.4.5",
    "tsx": "^4.10.5",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.12"
  }
}
EOF

# Backend TypeScript config
cat > backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Backend Types
cat > backend/src/types/index.ts << 'EOF'
export interface ModelPrediction {
  id: string;
  modelName: string;
  modelVersion: string;
  timestamp: number;
  timeWindow: {
    start: number;
    end: number;
  };
  predictions: {
    metricName: string;
    predictedValue: number;
    confidence: number;
  }[];
}

export interface ActualMetric {
  timestamp: number;
  metricName: string;
  actualValue: number;
  context: {
    userType?: string;
    operationType?: string;
    dataCenter?: string;
  };
}

export interface ValidationResult {
  modelName: string;
  modelVersion: string;
  timeWindow: {
    start: number;
    end: number;
  };
  metricName: string;
  predictedValue: number;
  actualValue: number;
  absoluteError: number;
  percentageError: number;
  accuracy: number;
  timestamp: number;
}

export interface ModelAccuracy {
  modelName: string;
  modelVersion: string;
  overallAccuracy: number;
  mape: number;
  validationCount: number;
  lastUpdated: number;
  accuracyHistory: {
    timestamp: number;
    accuracy: number;
  }[];
}

export interface ABTest {
  id: string;
  name: string;
  controlModel: {
    name: string;
    version: string;
  };
  treatmentModel: {
    name: string;
    version: string;
  };
  status: 'running' | 'completed' | 'failed';
  trafficSplit: {
    control: number;
    treatment: number;
  };
  metrics: {
    control: ModelAccuracy;
    treatment: ModelAccuracy;
  };
  startTime: number;
  endTime?: number;
  winner?: 'control' | 'treatment' | 'inconclusive';
}

export interface ModelConfig {
  name: string;
  version: string;
  type: 'latency' | 'cache' | 'queue' | 'capacity';
  parameters: Record<string, number>;
  enabled: boolean;
}
EOF

# Model Predictor Service
cat > backend/src/services/modelPredictor.ts << 'EOF'
import { ModelPrediction, ModelConfig } from '../types/index.js';

export class ModelPredictor {
  private models: Map<string, ModelConfig> = new Map();

  constructor() {
    this.initializeModels();
  }

  private initializeModels() {
    // Timeline Latency Model (Queuing Theory - M/M/1)
    this.models.set('timeline_latency', {
      name: 'timeline_latency',
      version: '1.0',
      type: 'latency',
      parameters: {
        serviceRate: 100, // requests per second
        avgServiceTime: 0.01 // 10ms
      },
      enabled: true
    });

    // Cache Hit Rate Model
    this.models.set('cache_hit_rate', {
      name: 'cache_hit_rate',
      version: '1.0',
      type: 'cache',
      parameters: {
        cacheSize: 10000,
        workingSetSize: 8000,
        zipfAlpha: 0.8
      },
      enabled: true
    });

    // Queue Depth Model
    this.models.set('queue_depth', {
      name: 'queue_depth',
      version: '1.0',
      type: 'queue',
      parameters: {
        arrivalRate: 50,
        serviceRate: 60
      },
      enabled: true
    });
  }

  predictTimelineLatency(arrivalRate: number): number {
    const model = this.models.get('timeline_latency');
    if (!model) return 0;

    const serviceRate = model.parameters.serviceRate;
    const avgServiceTime = model.parameters.avgServiceTime;
    
    // M/M/1 Queue: L = λ / (μ - λ)
    const utilization = arrivalRate / serviceRate;
    
    if (utilization >= 1) {
      return 999; // System overload
    }

    // Average response time: W = 1 / (μ - λ)
    const avgResponseTime = 1 / (serviceRate - arrivalRate);
    
    // P95 is approximately 3x average for M/M/1
    return avgResponseTime * 3 * 1000; // Convert to ms
  }

  predictCacheHitRate(requestCount: number, uniqueItems: number): number {
    const model = this.models.get('cache_hit_rate');
    if (!model) return 0;

    const cacheSize = model.parameters.cacheSize;
    const alpha = model.parameters.zipfAlpha;

    // Simplified Zipf distribution model
    const workingSetRatio = Math.min(uniqueItems / cacheSize, 1);
    const baseHitRate = 1 - Math.pow(workingSetRatio, alpha);
    
    // Adjust for request count (cache warming effect)
    const warmingFactor = Math.min(requestCount / 1000, 1);
    
    return baseHitRate * warmingFactor * 100;
  }

  predictQueueDepth(arrivalRate: number, serviceRate: number): number {
    const model = this.models.get('queue_depth');
    if (!model) return 0;

    // Little's Law: L = λ * W
    const utilization = arrivalRate / serviceRate;
    
    if (utilization >= 1) {
      return 100; // Queue growing unbounded
    }

    // Average number in system: L = ρ / (1 - ρ)
    return utilization / (1 - utilization);
  }

  generatePrediction(
    modelName: string,
    currentMetrics: { arrivalRate: number; requestCount: number; uniqueItems: number }
  ): ModelPrediction {
    const now = Date.now();
    const timeWindow = {
      start: now,
      end: now + 60000 // 1 minute window
    };

    let predictions: { metricName: string; predictedValue: number; confidence: number }[] = [];

    switch (modelName) {
      case 'timeline_latency':
        predictions = [{
          metricName: 'p95_latency_ms',
          predictedValue: this.predictTimelineLatency(currentMetrics.arrivalRate),
          confidence: 0.92
        }];
        break;
      case 'cache_hit_rate':
        predictions = [{
          metricName: 'hit_rate_percent',
          predictedValue: this.predictCacheHitRate(
            currentMetrics.requestCount,
            currentMetrics.uniqueItems
          ),
          confidence: 0.88
        }];
        break;
      case 'queue_depth':
        predictions = [{
          metricName: 'avg_queue_depth',
          predictedValue: this.predictQueueDepth(
            currentMetrics.arrivalRate,
            60 // Fixed service rate
          ),
          confidence: 0.90
        }];
        break;
    }

    const model = this.models.get(modelName);
    return {
      id: `pred_${now}_${modelName}`,
      modelName,
      modelVersion: model?.version || '1.0',
      timestamp: now,
      timeWindow,
      predictions
    };
  }

  getModel(name: string): ModelConfig | undefined {
    return this.models.get(name);
  }

  updateModel(name: string, parameters: Record<string, number>) {
    const model = this.models.get(name);
    if (model) {
      model.parameters = { ...model.parameters, ...parameters };
      model.version = (parseFloat(model.version) + 0.1).toFixed(1);
    }
  }
}
EOF

# Metrics Collector Service
cat > backend/src/services/metricsCollector.ts << 'EOF'
import { ActualMetric } from '../types/index.js';

export class MetricsCollector {
  private metrics: ActualMetric[] = [];
  private readonly MAX_METRICS = 10000;

  // Simulate actual production metrics
  collectTimelineLatency(requestCount: number): ActualMetric {
    // Simulate realistic latency with some variance
    const baseLatency = 150 + Math.random() * 50;
    const loadFactor = Math.min(requestCount / 50, 2);
    const actualLatency = baseLatency * loadFactor;

    const metric: ActualMetric = {
      timestamp: Date.now(),
      metricName: 'p95_latency_ms',
      actualValue: actualLatency,
      context: {
        operationType: 'timeline_fetch'
      }
    };

    this.storeMetric(metric);
    return metric;
  }

  collectCacheHitRate(cacheHits: number, totalRequests: number): ActualMetric {
    const hitRate = (cacheHits / totalRequests) * 100;

    const metric: ActualMetric = {
      timestamp: Date.now(),
      metricName: 'hit_rate_percent',
      actualValue: hitRate,
      context: {
        operationType: 'cache_access'
      }
    };

    this.storeMetric(metric);
    return metric;
  }

  collectQueueDepth(currentDepth: number): ActualMetric {
    const metric: ActualMetric = {
      timestamp: Date.now(),
      metricName: 'avg_queue_depth',
      actualValue: currentDepth,
      context: {
        operationType: 'queue_monitoring'
      }
    };

    this.storeMetric(metric);
    return metric;
  }

  private storeMetric(metric: ActualMetric) {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  getMetrics(metricName: string, startTime: number, endTime: number): ActualMetric[] {
    return this.metrics.filter(m => 
      m.metricName === metricName &&
      m.timestamp >= startTime &&
      m.timestamp <= endTime
    );
  }

  getRecentMetrics(metricName: string, count: number = 100): ActualMetric[] {
    return this.metrics
      .filter(m => m.metricName === metricName)
      .slice(-count);
  }

  clearOldMetrics(olderThan: number) {
    this.metrics = this.metrics.filter(m => m.timestamp > olderThan);
  }
}
EOF

# Validation Engine
cat > backend/src/services/validationEngine.ts << 'EOF'
import { ModelPrediction, ActualMetric, ValidationResult, ModelAccuracy } from '../types/index.js';
import * as stats from 'simple-statistics';

export class ValidationEngine {
  private validationResults: ValidationResult[] = [];
  private accuracyHistory: Map<string, ModelAccuracy> = new Map();

  validate(
    prediction: ModelPrediction,
    actualMetrics: ActualMetric[]
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const pred of prediction.predictions) {
      // Find matching actual metrics in the time window
      const matchingMetrics = actualMetrics.filter(m =>
        m.metricName === pred.metricName &&
        m.timestamp >= prediction.timeWindow.start &&
        m.timestamp <= prediction.timeWindow.end
      );

      if (matchingMetrics.length === 0) continue;

      // Calculate average actual value
      const actualValues = matchingMetrics.map(m => m.actualValue);
      const actualValue = stats.mean(actualValues);

      // Calculate errors
      const absoluteError = Math.abs(pred.predictedValue - actualValue);
      const percentageError = (absoluteError / actualValue) * 100;
      const accuracy = Math.max(0, 100 - percentageError);

      const result: ValidationResult = {
        modelName: prediction.modelName,
        modelVersion: prediction.modelVersion,
        timeWindow: prediction.timeWindow,
        metricName: pred.metricName,
        predictedValue: pred.predictedValue,
        actualValue,
        absoluteError,
        percentageError,
        accuracy,
        timestamp: Date.now()
      };

      results.push(result);
      this.storeValidationResult(result);
    }

    return results;
  }

  private storeValidationResult(result: ValidationResult) {
    this.validationResults.push(result);

    // Update accuracy history
    const key = `${result.modelName}_${result.modelVersion}`;
    let modelAccuracy = this.accuracyHistory.get(key);

    if (!modelAccuracy) {
      modelAccuracy = {
        modelName: result.modelName,
        modelVersion: result.modelVersion,
        overallAccuracy: 0,
        mape: 0,
        validationCount: 0,
        lastUpdated: Date.now(),
        accuracyHistory: []
      };
    }

    modelAccuracy.accuracyHistory.push({
      timestamp: result.timestamp,
      accuracy: result.accuracy
    });

    // Keep only last 100 entries
    if (modelAccuracy.accuracyHistory.length > 100) {
      modelAccuracy.accuracyHistory = modelAccuracy.accuracyHistory.slice(-100);
    }

    // Recalculate overall metrics
    const recentResults = this.validationResults
      .filter(r => r.modelName === result.modelName && r.modelVersion === result.modelVersion)
      .slice(-50);

    const accuracies = recentResults.map(r => r.accuracy);
    const percentageErrors = recentResults.map(r => r.percentageError);

    modelAccuracy.overallAccuracy = stats.mean(accuracies);
    modelAccuracy.mape = stats.mean(percentageErrors);
    modelAccuracy.validationCount = recentResults.length;
    modelAccuracy.lastUpdated = Date.now();

    this.accuracyHistory.set(key, modelAccuracy);
  }

  getModelAccuracy(modelName: string, modelVersion: string): ModelAccuracy | undefined {
    return this.accuracyHistory.get(`${modelName}_${modelVersion}`);
  }

  getAllModelAccuracies(): ModelAccuracy[] {
    return Array.from(this.accuracyHistory.values());
  }

  getRecentValidations(modelName: string, count: number = 50): ValidationResult[] {
    return this.validationResults
      .filter(r => r.modelName === modelName)
      .slice(-count);
  }

  checkAccuracyThreshold(modelName: string, threshold: number = 95): boolean {
    const recentResults = this.getRecentValidations(modelName, 10);
    if (recentResults.length === 0) return true;

    const avgAccuracy = stats.mean(recentResults.map(r => r.accuracy));
    return avgAccuracy >= threshold;
  }

  calculateStatisticalSignificance(
    controlResults: ValidationResult[],
    treatmentResults: ValidationResult[]
  ): { pValue: number; significant: boolean } {
    if (controlResults.length < 10 || treatmentResults.length < 10) {
      return { pValue: 1, significant: false };
    }

    const controlAccuracies = controlResults.map(r => r.accuracy);
    const treatmentAccuracies = treatmentResults.map(r => r.accuracy);

    // Simple t-test approximation
    const controlMean = stats.mean(controlAccuracies);
    const treatmentMean = stats.mean(treatmentAccuracies);
    const controlStd = stats.standardDeviation(controlAccuracies);
    const treatmentStd = stats.standardDeviation(treatmentAccuracies);

    const pooledStd = Math.sqrt(
      (controlStd ** 2) / controlResults.length +
      (treatmentStd ** 2) / treatmentResults.length
    );

    const tStat = Math.abs(treatmentMean - controlMean) / pooledStd;
    const pValue = 2 * (1 - this.normalCDF(tStat));

    return {
      pValue,
      significant: pValue < 0.05
    };
  }

  private normalCDF(z: number): number {
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private erf(x: number): number {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}
EOF

# AB Testing Service
cat > backend/src/services/abTestingService.ts << 'EOF'
import { ABTest, ModelConfig } from '../types/index.js';
import { ValidationEngine } from './validationEngine.js';

export class ABTestingService {
  private activeTests: Map<string, ABTest> = new Map();
  private validationEngine: ValidationEngine;

  constructor(validationEngine: ValidationEngine) {
    this.validationEngine = validationEngine;
  }

  createTest(
    name: string,
    controlModel: ModelConfig,
    treatmentModel: ModelConfig,
    trafficSplit: { control: number; treatment: number } = { control: 90, treatment: 10 }
  ): ABTest {
    const test: ABTest = {
      id: `test_${Date.now()}`,
      name,
      controlModel: {
        name: controlModel.name,
        version: controlModel.version
      },
      treatmentModel: {
        name: treatmentModel.name,
        version: treatmentModel.version
      },
      status: 'running',
      trafficSplit,
      metrics: {
        control: {
          modelName: controlModel.name,
          modelVersion: controlModel.version,
          overallAccuracy: 0,
          mape: 0,
          validationCount: 0,
          lastUpdated: Date.now(),
          accuracyHistory: []
        },
        treatment: {
          modelName: treatmentModel.name,
          modelVersion: treatmentModel.version,
          overallAccuracy: 0,
          mape: 0,
          validationCount: 0,
          lastUpdated: Date.now(),
          accuracyHistory: []
        }
      },
      startTime: Date.now()
    };

    this.activeTests.set(test.id, test);
    return test;
  }

  updateTestMetrics(testId: string) {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'running') return;

    // Get latest accuracy for both models
    const controlAccuracy = this.validationEngine.getModelAccuracy(
      test.controlModel.name,
      test.controlModel.version
    );
    const treatmentAccuracy = this.validationEngine.getModelAccuracy(
      test.treatmentModel.name,
      test.treatmentModel.version
    );

    if (controlAccuracy) test.metrics.control = controlAccuracy;
    if (treatmentAccuracy) test.metrics.treatment = treatmentAccuracy;

    // Check if we have enough data to make a decision
    if (controlAccuracy && treatmentAccuracy &&
        controlAccuracy.validationCount >= 30 && treatmentAccuracy.validationCount >= 30) {
      
      const controlResults = this.validationEngine.getRecentValidations(
        test.controlModel.name,
        30
      );
      const treatmentResults = this.validationEngine.getRecentValidations(
        test.treatmentModel.name,
        30
      );

      const significance = this.validationEngine.calculateStatisticalSignificance(
        controlResults,
        treatmentResults
      );

      if (significance.significant) {
        if (treatmentAccuracy.overallAccuracy > controlAccuracy.overallAccuracy) {
          test.winner = 'treatment';
        } else {
          test.winner = 'control';
        }
        test.status = 'completed';
        test.endTime = Date.now();
      }
    }
  }

  getTest(testId: string): ABTest | undefined {
    return this.activeTests.get(testId);
  }

  getAllTests(): ABTest[] {
    return Array.from(this.activeTests.values());
  }

  getActiveTests(): ABTest[] {
    return this.getAllTests().filter(t => t.status === 'running');
  }
}
EOF

# Production Simulator (generates realistic metrics)
cat > backend/src/services/productionSimulator.ts << 'EOF'
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
EOF

# Main Server
cat > backend/src/server.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { ModelPredictor } from './services/modelPredictor.js';
import { MetricsCollector } from './services/metricsCollector.js';
import { ValidationEngine } from './services/validationEngine.js';
import { ABTestingService } from './services/abTestingService.js';
import { ProductionSimulator } from './services/productionSimulator.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize services
const predictor = new ModelPredictor();
const collector = new MetricsCollector();
const validator = new ValidationEngine();
const abTesting = new ABTestingService(validator);
const simulator = new ProductionSimulator();

// REST API Routes
app.get('/api/models', (req, res) => {
  const models = ['timeline_latency', 'cache_hit_rate', 'queue_depth'].map(name => 
    predictor.getModel(name)
  );
  res.json(models.filter(Boolean));
});

app.get('/api/accuracy', (req, res) => {
  const accuracies = validator.getAllModelAccuracies();
  res.json(accuracies);
});

app.get('/api/validations/:modelName', (req, res) => {
  const { modelName } = req.params;
  const validations = validator.getRecentValidations(modelName, 50);
  res.json(validations);
});

app.get('/api/tests', (req, res) => {
  const tests = abTesting.getAllTests();
  res.json(tests);
});

app.post('/api/tests', (req, res) => {
  const { name, controlModel, treatmentModel } = req.body;
  const test = abTesting.createTest(
    name,
    controlModel,
    treatmentModel
  );
  res.json(test);
});

app.get('/api/metrics/current', (req, res) => {
  const metrics = simulator.getMetrics();
  res.json(metrics);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✓ Model Validation API running on port ${PORT}`);
});

// WebSocket for real-time updates
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to validation stream');
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Broadcast to all connected clients
function broadcast(data: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// Main validation loop
setInterval(() => {
  // Simulate production
  simulator.tick();
  const metrics = simulator.getMetrics();

  // Generate predictions
  const models = ['timeline_latency', 'cache_hit_rate', 'queue_depth'];
  
  models.forEach(modelName => {
    const prediction = predictor.generatePrediction(modelName, metrics);
    
    // Collect actual metrics
    let actualMetric;
    switch (modelName) {
      case 'timeline_latency':
        actualMetric = collector.collectTimelineLatency(metrics.arrivalRate);
        break;
      case 'cache_hit_rate':
        actualMetric = collector.collectCacheHitRate(
          metrics.cacheHits,
          metrics.totalRequests
        );
        break;
      case 'queue_depth':
        actualMetric = collector.collectQueueDepth(metrics.queueDepth);
        break;
    }

    // Validate predictions against actuals
    if (actualMetric) {
      const validationResults = validator.validate(prediction, [actualMetric]);
      
      // Check if accuracy threshold violated
      const meetsThreshold = validator.checkAccuracyThreshold(modelName, 95);
      
      if (!meetsThreshold) {
        console.log(`⚠ Model ${modelName} accuracy below 95% threshold`);
      }

      // Broadcast results
      broadcast({
        type: 'validation',
        modelName,
        results: validationResults,
        accuracy: validator.getModelAccuracy(modelName, prediction.modelVersion),
        meetsThreshold
      });
    }
  });

  // Update active A/B tests
  abTesting.getActiveTests().forEach(test => {
    abTesting.updateTestMetrics(test.id);
    broadcast({
      type: 'ab_test_update',
      test
    });
  });

}, 2000); // Every 2 seconds

console.log('✓ Validation loop started');
console.log('✓ Generating predictions and validating against production metrics...');

// Cleanup old metrics every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  collector.clearOldMetrics(fiveMinutesAgo);
}, 5 * 60 * 1000);

// Create initial A/B test
setTimeout(() => {
  const timelineModel = predictor.getModel('timeline_latency');
  if (timelineModel) {
    // Create treatment model with adjusted parameters
    const treatmentModel = {
      ...timelineModel,
      version: '1.1',
      parameters: {
        ...timelineModel.parameters,
        serviceRate: timelineModel.parameters.serviceRate * 1.05
      }
    };

    const test = abTesting.createTest(
      'Timeline Latency Model Improvement',
      timelineModel,
      treatmentModel
    );
    console.log(`✓ Created A/B test: ${test.name}`);
  }
}, 5000);
EOF

# Frontend package.json
cat > frontend/package.json << 'EOF'
{
  "name": "twitter-model-validation-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.12.7",
    "typescript": "^5.4.5"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.2.12"
  }
}
EOF

# Vite config
cat > frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
});
EOF

# Frontend TypeScript config
cat > frontend/tsconfig.json << 'EOF'
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
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > frontend/tsconfig.node.json << 'EOF'
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

# Frontend Types
cat > frontend/src/types.ts << 'EOF'
export interface ValidationResult {
  modelName: string;
  modelVersion: string;
  timeWindow: {
    start: number;
    end: number;
  };
  metricName: string;
  predictedValue: number;
  actualValue: number;
  absoluteError: number;
  percentageError: number;
  accuracy: number;
  timestamp: number;
}

export interface ModelAccuracy {
  modelName: string;
  modelVersion: string;
  overallAccuracy: number;
  mape: number;
  validationCount: number;
  lastUpdated: number;
  accuracyHistory: {
    timestamp: number;
    accuracy: number;
  }[];
}

export interface ABTest {
  id: string;
  name: string;
  controlModel: {
    name: string;
    version: string;
  };
  treatmentModel: {
    name: string;
    version: string;
  };
  status: 'running' | 'completed' | 'failed';
  trafficSplit: {
    control: number;
    treatment: number;
  };
  metrics: {
    control: ModelAccuracy;
    treatment: ModelAccuracy;
  };
  startTime: number;
  endTime?: number;
  winner?: 'control' | 'treatment' | 'inconclusive';
}
EOF

# WebSocket Hook
cat > frontend/src/hooks/useWebSocket.ts << 'EOF'
import { useEffect, useState, useCallback } from 'react';

export function useWebSocket<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setData(parsed);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { data, connected };
}
EOF

# Accuracy Panel Component
cat > frontend/src/components/AccuracyPanel.tsx << 'EOF'
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ModelAccuracy } from '../types';

interface AccuracyPanelProps {
  accuracies: ModelAccuracy[];
}

export const AccuracyPanel: React.FC<AccuracyPanelProps> = ({ accuracies }) => {
  const formatModelName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '8px', 
      padding: '20px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
    }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600 }}>
        Model Accuracy Overview
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {accuracies.map(acc => (
          <div key={`${acc.modelName}_${acc.modelVersion}`} style={{
            border: `2px solid ${acc.overallAccuracy >= 95 ? '#10b981' : '#ef4444'}`,
            borderRadius: '6px',
            padding: '15px',
            background: acc.overallAccuracy >= 95 ? '#f0fdf4' : '#fef2f2'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                {formatModelName(acc.modelName)}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Version {acc.modelVersion}
              </div>
            </div>

            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '5px' }}>
              {acc.overallAccuracy.toFixed(1)}%
            </div>
            
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              MAPE: {acc.mape.toFixed(2)}% | Validations: {acc.validationCount}
            </div>

            {acc.accuracyHistory.length > 0 && (
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={acc.accuracyHistory}>
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke={acc.overallAccuracy >= 95 ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    dot={false}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Accuracy']}
                    labelFormatter={(label: number) => formatTimestamp(label)}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {acc.overallAccuracy < 95 && (
              <div style={{
                marginTop: '10px',
                padding: '8px',
                background: '#fee2e2',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#991b1b'
              }}>
                ⚠️ Below 95% threshold - needs recalibration
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
EOF

# Validation Chart Component
cat > frontend/src/components/ValidationChart.tsx << 'EOF'
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ValidationResult } from '../types';

interface ValidationChartProps {
  validations: ValidationResult[];
  modelName: string;
}

export const ValidationChart: React.FC<ValidationChartProps> = ({ validations, modelName }) => {
  const formatModelName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const chartData = validations.map(v => ({
    timestamp: v.timestamp,
    predicted: v.predictedValue,
    actual: v.actualValue,
    error: v.percentageError
  }));

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '8px', 
      padding: '20px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginTop: '20px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 600 }}>
        {formatModelName(modelName)} - Predicted vs Actual
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTimestamp}
            style={{ fontSize: '12px' }}
          />
          <YAxis style={{ fontSize: '12px' }} />
          <Tooltip 
            formatter={(value: number) => value.toFixed(2)}
            labelFormatter={(label: number) => formatTimestamp(label)}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#3b82f6" 
            name="Predicted"
            strokeWidth={2}
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="actual" 
            stroke="#10b981" 
            name="Actual"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {validations.length > 0 && (
        <div style={{ marginTop: '15px', display: 'flex', gap: '20px', fontSize: '14px' }}>
          <div>
            <span style={{ color: '#666' }}>Latest Predicted:</span>
            <strong style={{ marginLeft: '8px' }}>
              {validations[validations.length - 1].predictedValue.toFixed(2)}
            </strong>
          </div>
          <div>
            <span style={{ color: '#666' }}>Latest Actual:</span>
            <strong style={{ marginLeft: '8px' }}>
              {validations[validations.length - 1].actualValue.toFixed(2)}
            </strong>
          </div>
          <div>
            <span style={{ color: '#666' }}>Error:</span>
            <strong 
              style={{ 
                marginLeft: '8px',
                color: validations[validations.length - 1].percentageError < 5 ? '#10b981' : '#ef4444'
              }}
            >
              {validations[validations.length - 1].percentageError.toFixed(2)}%
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};
EOF

# AB Test Panel Component
cat > frontend/src/components/ABTestPanel.tsx << 'EOF'
import React from 'react';
import { ABTest } from '../types';

interface ABTestPanelProps {
  tests: ABTest[];
}

export const ABTestPanel: React.FC<ABTestPanelProps> = ({ tests }) => {
  const formatDuration = (start: number, end?: number) => {
    const duration = (end || Date.now()) - start;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '8px', 
      padding: '20px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginTop: '20px'
    }}>
      <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600 }}>
        A/B Test Experiments
      </h2>

      {tests.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          No active experiments
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {tests.map(test => (
            <div 
              key={test.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '15px',
                background: test.status === 'running' ? '#f0fdf4' : '#f9fafb'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{test.name}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Duration: {formatDuration(test.startTime, test.endTime)}
                  </div>
                </div>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: test.status === 'running' ? '#10b981' : '#6b7280',
                  color: 'white'
                }}>
                  {test.status.toUpperCase()}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{
                  padding: '12px',
                  background: test.winner === 'control' ? '#dbeafe' : '#f3f4f6',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                    Control (v{test.controlModel.version})
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                    {test.metrics.control.overallAccuracy.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    MAPE: {test.metrics.control.mape.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Validations: {test.metrics.control.validationCount}
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  background: test.winner === 'treatment' ? '#dbeafe' : '#f3f4f6',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                    Treatment (v{test.treatmentModel.version})
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                    {test.metrics.treatment.overallAccuracy.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    MAPE: {test.metrics.treatment.mape.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Validations: {test.metrics.treatment.validationCount}
                  </div>
                </div>
              </div>

              {test.winner && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px',
                  background: '#dbeafe',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1e40af',
                  textAlign: 'center'
                }}>
                  Winner: {test.winner === 'control' ? 'Control' : 'Treatment'} Model
                </div>
              )}

              <div style={{
                marginTop: '12px',
                padding: '8px',
                background: '#f9fafb',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#666'
              }}>
                Traffic Split: {test.trafficSplit.control}% control / {test.trafficSplit.treatment}% treatment
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
EOF

# Main App Component
cat > frontend/src/App.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { AccuracyPanel } from './components/AccuracyPanel';
import { ValidationChart } from './components/ValidationChart';
import { ABTestPanel } from './components/ABTestPanel';
import { ModelAccuracy, ValidationResult, ABTest } from './types';

const API_URL = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001';

function App() {
  const [accuracies, setAccuracies] = useState<ModelAccuracy[]>([]);
  const [validations, setValidations] = useState<Record<string, ValidationResult[]>>({});
  const [tests, setTests] = useState<ABTest[]>([]);
  const { data: wsData, connected } = useWebSocket(WS_URL);

  // Fetch initial data
  useEffect(() => {
    fetchAccuracies();
    fetchTests();
    fetchValidations();
  }, []);

  // Handle WebSocket updates
  useEffect(() => {
    if (!wsData) return;

    const message = wsData as any;
    
    if (message.type === 'validation') {
      if (message.accuracy) {
        setAccuracies(prev => {
          const filtered = prev.filter(a => 
            !(a.modelName === message.accuracy.modelName && 
              a.modelVersion === message.accuracy.modelVersion)
          );
          return [...filtered, message.accuracy];
        });
      }

      if (message.results && message.results.length > 0) {
        const result = message.results[0];
        setValidations(prev => ({
          ...prev,
          [message.modelName]: [
            ...(prev[message.modelName] || []).slice(-49),
            result
          ]
        }));
      }
    } else if (message.type === 'ab_test_update') {
      setTests(prev => {
        const filtered = prev.filter(t => t.id !== message.test.id);
        return [...filtered, message.test];
      });
    }
  }, [wsData]);

  const fetchAccuracies = async () => {
    try {
      const response = await fetch(`${API_URL}/accuracy`);
      const data = await response.json();
      setAccuracies(data);
    } catch (error) {
      console.error('Failed to fetch accuracies:', error);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await fetch(`${API_URL}/tests`);
      const data = await response.json();
      setTests(data);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    }
  };

  const fetchValidations = async () => {
    const models = ['timeline_latency', 'cache_hit_rate', 'queue_depth'];
    
    for (const model of models) {
      try {
        const response = await fetch(`${API_URL}/validations/${model}`);
        const data = await response.json();
        setValidations(prev => ({ ...prev, [model]: data }));
      } catch (error) {
        console.error(`Failed to fetch validations for ${model}:`, error);
      }
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '20px', 
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
                Mathematical Model Validation Dashboard
              </h1>
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                Real-time validation of mathematical models against production metrics
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '6px',
              background: connected ? '#f0fdf4' : '#fef2f2',
              fontSize: '14px',
              fontWeight: 600
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: connected ? '#10b981' : '#ef4444'
              }} />
              {connected ? 'Live' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* Accuracy Overview */}
        <AccuracyPanel accuracies={accuracies} />

        {/* Validation Charts */}
        {Object.entries(validations).map(([modelName, results]) => (
          results.length > 0 && (
            <ValidationChart 
              key={modelName}
              modelName={modelName}
              validations={results}
            />
          )
        ))}

        {/* A/B Tests */}
        <ABTestPanel tests={tests} />

        {/* Footer Info */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          color: 'white',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          Lesson 48: Mathematical Modeling Validation | Twitter System Design Course
          <br />
          Validating predictions with 95%+ accuracy threshold
        </div>
      </div>
    </div>
  );
}

export default App;
EOF

# Main entry point
cat > frontend/src/main.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# HTML template
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mathematical Model Validation</title>
    <style>
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
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# Create build scripts
cat > build.sh << 'EOFBUILD'
#!/bin/bash
set -e

echo "Building Twitter Model Validation System..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✓ Build complete!"
echo ""
echo "To start the system:"
echo "  ./start.sh"
EOFBUILD

chmod +x build.sh

cat > start.sh << 'EOFSTART'
#!/bin/bash

echo "Starting Twitter Model Validation System..."

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ System started!"
echo "✓ Backend API: http://localhost:3001"
echo "✓ Frontend Dashboard: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOFSTART

chmod +x start.sh

cat > stop.sh << 'EOFSTOP'
#!/bin/bash

echo "Stopping all services..."

# Kill all node processes related to our project
pkill -f "tsx watch src/server.ts" || true
pkill -f "vite" || true

echo "✓ All services stopped"
EOFSTOP

chmod +x stop.sh

# Create README
cat > README.md << 'EOF'
# Lesson 48: Mathematical Model Validation System

A production-ready system for validating mathematical models against actual production metrics.

## Features

- **Real-Time Validation**: Continuous comparison of predictions vs actuals
- **Accuracy Tracking**: Monitor model performance with 95%+ accuracy threshold
- **A/B Testing**: Compare model versions with statistical significance testing
- **Live Dashboard**: Real-time visualization of model performance

## Quick Start

1. Build the system:
```bash
./build.sh
```

2. Start all services:
```bash
./start.sh
```

3. Open dashboard:
- Frontend: http://localhost:3000
- API: http://localhost:3001

4. Stop services:
```bash
./stop.sh
```

## System Components

### Backend (Port 3001)
- Model Predictor: Generates predictions using queuing theory
- Metrics Collector: Captures actual production metrics
- Validation Engine: Compares predictions vs actuals
- A/B Testing Service: Statistical comparison of model versions

### Frontend (Port 3000)
- Accuracy Panel: Real-time model performance overview
- Validation Charts: Predicted vs actual visualizations
- A/B Test Panel: Experiment tracking and results

## Validation Models

1. **Timeline Latency**: M/M/1 queuing model for API response times
2. **Cache Hit Rate**: Zipf distribution model for cache performance
3. **Queue Depth**: Little's Law application for queue sizing

## Success Criteria

- ✓ 95%+ prediction accuracy maintained continuously
- ✓ Real-time validation with <2 second latency
- ✓ Automatic alert when accuracy drops below threshold
- ✓ Statistical A/B testing with significance detection

## Learning Outcomes

- Mathematical model validation techniques
- Production metrics collection and alignment
- Statistical significance testing for infrastructure
- Real-time monitoring and alerting systems
EOF

echo "=================================================="
echo "✓ Project structure created successfully!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. ./build.sh          # Install dependencies"
echo "3. ./start.sh          # Start all services"
echo ""
echo "Dashboard will be available at:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:3001"
echo ""
echo "The system will:"
echo "  ✓ Generate mathematical predictions every 2 seconds"
echo "  ✓ Collect actual production metrics"
echo "  ✓ Validate predictions against actuals"
echo "  ✓ Track accuracy over time"
echo "  ✓ Alert when accuracy drops below 95%"
echo "  ✓ Run A/B tests for model improvements"
echo "=================================================="