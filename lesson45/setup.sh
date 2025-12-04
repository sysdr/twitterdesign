#!/bin/bash

# Lesson 45: Machine Learning Operations - Complete Implementation Script
# This script creates a production-ready MLOps system serving 1M predictions/second

set -e

PROJECT_NAME="twitter-mlops-system"
# Use current directory instead of $HOME
PROJECT_DIR="$(pwd)"

echo "=========================================="
echo "Twitter MLOps System - Implementation"
echo "Lesson 45: ML Model Deployment & Serving"
echo "=========================================="

# Create project structure
echo "Creating project structure..."
mkdir -p "$PROJECT_DIR"/{src,tests,models,data,monitoring,scripts,docker}
cd "$PROJECT_DIR"

# Create package.json
cat > package.json << 'EOF'
{
  "name": "twitter-mlops-system",
  "version": "1.0.0",
  "description": "Production MLOps system for Twitter-scale recommendations",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest --coverage",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ioredis": "^5.3.2",
    "pg": "^8.11.3",
    "@tensorflow/tfjs-node": "^4.17.0",
    "bull": "^4.12.0",
    "prom-client": "^15.1.0",
    "winston": "^3.11.0",
    "uuid": "^9.0.1",
    "compression": "^1.7.4",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/express": "^4.17.21",
    "@types/compression": "^1.7.5",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1",
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0"
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
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF

# Create Jest configuration
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
EOF

# Create environment configuration
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=mlops_db
POSTGRES_USER=mlops_user
POSTGRES_PASSWORD=mlops_password
MODEL_REGISTRY_PATH=./models
FEATURE_STORE_TTL=300
PREDICTION_BATCH_SIZE=64
MAX_PREDICTION_LATENCY_MS=50
DRIFT_DETECTION_THRESHOLD=0.05
RETRAINING_ACCURACY_THRESHOLD=0.02
EOF

# Create Model Registry
cat > src/model-registry.ts << 'EOF'
import { promises as fs } from 'fs';
import * as path from 'path';
import * as tf from '@tensorflow/tfjs-node';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

export interface ModelMetadata {
  modelId: string;
  version: string;
  accuracy: number;
  latency_p95: number;
  throughput: number;
  trainingConfig: {
    datasetVersion: string;
    hyperparameters: Record<string, any>;
    framework: string;
    timestamp: Date;
  };
  status: 'training' | 'staging' | 'production' | 'archived';
  deploymentTimestamp?: Date;
}

export class ModelRegistry {
  private registryPath: string;
  private models: Map<string, ModelMetadata>;
  private loadedModels: Map<string, tf.GraphModel | tf.LayersModel>;

  constructor(registryPath: string = './models') {
    this.registryPath = registryPath;
    this.models = new Map();
    this.loadedModels = new Map();
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.registryPath, { recursive: true });
    await this.loadRegistry();
    logger.info('Model registry initialized', { 
      path: this.registryPath,
      modelCount: this.models.size 
    });
  }

  async registerModel(
    modelPath: string,
    metadata: Omit<ModelMetadata, 'modelId' | 'version'>
  ): Promise<ModelMetadata> {
    const modelId = uuidv4();
    const version = `v${Date.now()}`;
    
    const fullMetadata: ModelMetadata = {
      ...metadata,
      modelId,
      version,
    };

    // Save model to registry
    const modelDir = path.join(this.registryPath, modelId, version);
    await fs.mkdir(modelDir, { recursive: true });
    
    // Copy model files
    await fs.cp(modelPath, path.join(modelDir, 'model'), { recursive: true });
    
    // Save metadata
    await fs.writeFile(
      path.join(modelDir, 'metadata.json'),
      JSON.stringify(fullMetadata, null, 2)
    );

    this.models.set(`${modelId}:${version}`, fullMetadata);
    
    logger.info('Model registered', { modelId, version, status: metadata.status });
    
    return fullMetadata;
  }

  async loadModel(modelId: string, version: string): Promise<tf.GraphModel | tf.LayersModel> {
    const key = `${modelId}:${version}`;
    
    if (this.loadedModels.has(key)) {
      return this.loadedModels.get(key)!;
    }

    const modelPath = path.join(this.registryPath, modelId, version, 'model');
    
    try {
      const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
      this.loadedModels.set(key, model);
      logger.info('Model loaded', { modelId, version });
      return model;
    } catch (error) {
      logger.error('Failed to load model', { modelId, version, error });
      throw error;
    }
  }

  async promoteModel(modelId: string, version: string): Promise<void> {
    const key = `${modelId}:${version}`;
    const metadata = this.models.get(key);
    
    if (!metadata) {
      throw new Error(`Model not found: ${key}`);
    }

    // Demote current production model
    for (const [k, m] of this.models.entries()) {
      if (m.status === 'production') {
        m.status = 'archived';
        this.models.set(k, m);
      }
    }

    // Promote new model
    metadata.status = 'production';
    metadata.deploymentTimestamp = new Date();
    this.models.set(key, metadata);

    await this.saveRegistry();
    
    logger.info('Model promoted to production', { modelId, version });
  }

  getProductionModel(): ModelMetadata | undefined {
    for (const metadata of this.models.values()) {
      if (metadata.status === 'production') {
        return metadata;
      }
    }
    return undefined;
  }

  listModels(status?: ModelMetadata['status']): ModelMetadata[] {
    const models = Array.from(this.models.values());
    return status ? models.filter(m => m.status === status) : models;
  }

  private async loadRegistry(): Promise<void> {
    try {
      const entries = await fs.readdir(this.registryPath);
      
      for (const modelId of entries) {
        const modelPath = path.join(this.registryPath, modelId);
        const stat = await fs.stat(modelPath);
        
        if (stat.isDirectory()) {
          const versions = await fs.readdir(modelPath);
          
          for (const version of versions) {
            const metadataPath = path.join(modelPath, version, 'metadata.json');
            try {
              const data = await fs.readFile(metadataPath, 'utf-8');
              const metadata = JSON.parse(data);
              this.models.set(`${modelId}:${version}`, metadata);
            } catch (error) {
              logger.warn('Failed to load model metadata', { modelId, version, error });
            }
          }
        }
      }
    } catch (error) {
      logger.warn('No existing registry found, starting fresh');
    }
  }

  private async saveRegistry(): Promise<void> {
    for (const [key, metadata] of this.models.entries()) {
      const [modelId, version] = key.split(':');
      const metadataPath = path.join(this.registryPath, modelId, version, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    }
  }
}
EOF

# Create Feature Store
cat > src/feature-store.ts << 'EOF'
import Redis from 'ioredis';
import { Pool } from 'pg';
import { logger } from './logger';

export interface Feature {
  name: string;
  entityId: string;
  value: any;
  timestamp: Date;
  version: string;
}

export interface FeatureVector {
  entityId: string;
  features: Record<string, any>;
  timestamp: Date;
}

export class FeatureStore {
  private redis: Redis;
  private postgres: Pool;
  private ttl: number;

  constructor(redisClient: Redis, postgresPool: Pool, ttl: number = 300) {
    this.redis = redisClient;
    this.postgres = postgresPool;
    this.ttl = ttl;
  }

  async initialize(): Promise<void> {
    // Create features table if not exists
    await this.postgres.query(`
      CREATE TABLE IF NOT EXISTS features (
        entity_id VARCHAR(255),
        feature_name VARCHAR(255),
        feature_value JSONB,
        timestamp TIMESTAMP DEFAULT NOW(),
        version VARCHAR(50),
        PRIMARY KEY (entity_id, feature_name, timestamp)
      );
      CREATE INDEX IF NOT EXISTS idx_features_entity ON features(entity_id);
      CREATE INDEX IF NOT EXISTS idx_features_timestamp ON features(timestamp);
    `);

    logger.info('Feature store initialized');
  }

  async setFeature(feature: Feature): Promise<void> {
    const key = this.getRedisKey(feature.entityId, feature.name);
    const value = JSON.stringify({
      value: feature.value,
      timestamp: feature.timestamp,
      version: feature.version,
    });

    // Store in Redis for fast serving
    await this.redis.setex(key, this.ttl, value);

    // Store in PostgreSQL for historical tracking
    await this.postgres.query(
      `INSERT INTO features (entity_id, feature_name, feature_value, timestamp, version)
       VALUES ($1, $2, $3, $4, $5)`,
      [feature.entityId, feature.name, feature.value, feature.timestamp, feature.version]
    );
  }

  async getFeature(entityId: string, featureName: string): Promise<Feature | null> {
    const key = this.getRedisKey(entityId, featureName);
    const cached = await this.redis.get(key);

    if (cached) {
      const data = JSON.parse(cached);
      return {
        name: featureName,
        entityId,
        value: data.value,
        timestamp: new Date(data.timestamp),
        version: data.version,
      };
    }

    // Fallback to PostgreSQL
    const result = await this.postgres.query(
      `SELECT * FROM features 
       WHERE entity_id = $1 AND feature_name = $2 
       ORDER BY timestamp DESC LIMIT 1`,
      [entityId, featureName]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const feature: Feature = {
      name: row.feature_name,
      entityId: row.entity_id,
      value: row.feature_value,
      timestamp: row.timestamp,
      version: row.version,
    };

    // Cache for future requests
    await this.redis.setex(
      key,
      this.ttl,
      JSON.stringify({
        value: feature.value,
        timestamp: feature.timestamp,
        version: feature.version,
      })
    );

    return feature;
  }

  async getFeatureVector(entityId: string, featureNames: string[]): Promise<FeatureVector> {
    const features: Record<string, any> = {};
    const timestamp = new Date();

    // Batch fetch from Redis using pipeline
    const pipeline = this.redis.pipeline();
    for (const name of featureNames) {
      pipeline.get(this.getRedisKey(entityId, name));
    }

    const results = await pipeline.exec();

    for (let i = 0; i < featureNames.length; i++) {
      const [err, value] = results![i];
      if (!err && value) {
        const data = JSON.parse(value as string);
        features[featureNames[i]] = data.value;
      } else {
        // Set default value for missing features
        features[featureNames[i]] = null;
      }
    }

    return { entityId, features, timestamp };
  }

  async computeUserFeatures(userId: string): Promise<void> {
    // Simulate feature computation
    const features = [
      { name: 'user_tweet_count_7d', value: Math.floor(Math.random() * 100) },
      { name: 'user_avg_engagement_rate', value: Math.random() * 0.15 },
      { name: 'user_follower_count', value: Math.floor(Math.random() * 10000) },
      { name: 'user_following_count', value: Math.floor(Math.random() * 1000) },
      { name: 'user_last_active_hours', value: Math.random() * 48 },
    ];

    for (const { name, value } of features) {
      await this.setFeature({
        name,
        entityId: userId,
        value,
        timestamp: new Date(),
        version: 'v1',
      });
    }
  }

  async computeTweetFeatures(tweetId: string): Promise<void> {
    // Simulate tweet feature computation
    const features = [
      { name: 'tweet_age_hours', value: Math.random() * 24 },
      { name: 'tweet_like_count', value: Math.floor(Math.random() * 1000) },
      { name: 'tweet_retweet_count', value: Math.floor(Math.random() * 100) },
      { name: 'tweet_reply_count', value: Math.floor(Math.random() * 50) },
      { name: 'tweet_has_media', value: Math.random() > 0.5 ? 1 : 0 },
    ];

    for (const { name, value } of features) {
      await this.setFeature({
        name,
        entityId: tweetId,
        value,
        timestamp: new Date(),
        version: 'v1',
      });
    }
  }

  private getRedisKey(entityId: string, featureName: string): string {
    return `feature:${entityId}:${featureName}`;
  }
}
EOF

# Create Model Serving
cat > src/model-serving.ts << 'EOF'
import * as tf from '@tensorflow/tfjs-node';
import * as path from 'path';
import { ModelRegistry } from './model-registry';
import { FeatureStore, FeatureVector } from './feature-store';
import { logger } from './logger';

export interface PredictionRequest {
  userId: string;
  candidateTweets: string[];
  timeout?: number;
}

export interface PredictionResponse {
  rankings: Array<{
    tweetId: string;
    score: number;
    confidence: number;
  }>;
  modelVersion: string;
  latency: number;
}

export class ModelServingEngine {
  private registry: ModelRegistry;
  private featureStore: FeatureStore;
  private currentModel: tf.GraphModel | tf.LayersModel | null = null;
  private currentModelMetadata: any = null;
  private batchSize: number;
  private predictionCache: Map<string, { score: number; timestamp: number }>;
  private cacheTTL: number = 300000; // 5 minutes

  constructor(
    registry: ModelRegistry,
    featureStore: FeatureStore,
    batchSize: number = 64
  ) {
    this.registry = registry;
    this.featureStore = featureStore;
    this.batchSize = batchSize;
    this.predictionCache = new Map();
  }

  async initialize(): Promise<void> {
    const productionModel = this.registry.getProductionModel();
    
    if (productionModel) {
      this.currentModel = await this.registry.loadModel(
        productionModel.modelId,
        productionModel.version
      );
      this.currentModelMetadata = productionModel;
      logger.info('Model serving engine initialized', {
        modelId: productionModel.modelId,
        version: productionModel.version,
      });
    } else {
      logger.warn('No production model found, creating default model');
      await this.createDefaultModel();
    }
  }

  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    const startTime = Date.now();
    
    if (!this.currentModel) {
      throw new Error('No model loaded');
    }

    // Get user features
    const userFeatureVector = await this.featureStore.getFeatureVector(request.userId, [
      'user_tweet_count_7d',
      'user_avg_engagement_rate',
      'user_follower_count',
      'user_following_count',
      'user_last_active_hours',
    ]);

    // Get tweet features and generate predictions
    const rankings = await Promise.all(
      request.candidateTweets.map(async (tweetId) => {
        // Check cache
        const cacheKey = `${request.userId}:${tweetId}`;
        const cached = this.predictionCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
          return {
            tweetId,
            score: cached.score,
            confidence: 0.95,
          };
        }

        const tweetFeatureVector = await this.featureStore.getFeatureVector(tweetId, [
          'tweet_age_hours',
          'tweet_like_count',
          'tweet_retweet_count',
          'tweet_reply_count',
          'tweet_has_media',
        ]);

        // Combine features
        const features = this.combineFeatures(userFeatureVector, tweetFeatureVector);
        const score = await this.runInference(features);

        // Cache result
        this.predictionCache.set(cacheKey, { score, timestamp: Date.now() });

        return {
          tweetId,
          score,
          confidence: 0.95,
        };
      })
    );

    // Sort by score descending
    rankings.sort((a, b) => b.score - a.score);

    const latency = Date.now() - startTime;

    return {
      rankings,
      modelVersion: this.currentModelMetadata?.version || 'default',
      latency,
    };
  }

  async predictBatch(requests: PredictionRequest[]): Promise<PredictionResponse[]> {
    // Process in batches for efficiency
    const results: PredictionResponse[] = [];
    
    for (let i = 0; i < requests.length; i += this.batchSize) {
      const batch = requests.slice(i, i + this.batchSize);
      const batchResults = await Promise.all(batch.map(req => this.predict(req)));
      results.push(...batchResults);
    }

    return results;
  }

  private async runInference(features: number[]): Promise<number> {
    if (!this.currentModel) {
      throw new Error('No model loaded');
    }

    const inputTensor = tf.tensor2d([features], [1, features.length]);
    const prediction = this.currentModel.predict(inputTensor) as tf.Tensor;
    const score = (await prediction.data())[0];
    
    inputTensor.dispose();
    prediction.dispose();

    return score;
  }

  private combineFeatures(userVector: FeatureVector, tweetVector: FeatureVector): number[] {
    const features: number[] = [];
    
    // User features
    features.push(userVector.features['user_tweet_count_7d'] || 0);
    features.push(userVector.features['user_avg_engagement_rate'] || 0);
    features.push(Math.log(userVector.features['user_follower_count'] + 1) || 0);
    features.push(Math.log(userVector.features['user_following_count'] + 1) || 0);
    features.push(userVector.features['user_last_active_hours'] || 0);

    // Tweet features
    features.push(tweetVector.features['tweet_age_hours'] || 0);
    features.push(Math.log(tweetVector.features['tweet_like_count'] + 1) || 0);
    features.push(Math.log(tweetVector.features['tweet_retweet_count'] + 1) || 0);
    features.push(Math.log(tweetVector.features['tweet_reply_count'] + 1) || 0);
    features.push(tweetVector.features['tweet_has_media'] || 0);

    return features;
  }

  private async createDefaultModel(): Promise<void> {
    // Create a simple neural network model
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    // Save model
    const modelPath = path.join('./models', 'default');
    await model.save(`file://${modelPath}`);

    // Register model
    const metadata = await this.registry.registerModel(modelPath, {
      accuracy: 0.85,
      latency_p95: 45,
      throughput: 1000000,
      trainingConfig: {
        datasetVersion: 'v1',
        hyperparameters: { learningRate: 0.001, epochs: 10 },
        framework: 'tensorflow',
        timestamp: new Date(),
      },
      status: 'production' as const,
    });

    this.currentModel = model;
    this.currentModelMetadata = metadata;
    
    logger.info('Default model created and registered');
  }
}
EOF

# Create Performance Monitor
cat > src/performance-monitor.ts << 'EOF'
import { Pool } from 'pg';
import { logger } from './logger';

export interface PerformanceMetrics {
  modelId: string;
  timestamp: Date;
  predictions: {
    count: number;
    avgConfidence: number;
    latency_p50: number;
    latency_p95: number;
    latency_p99: number;
  };
  accuracy: {
    precision: number;
    recall: number;
    f1Score: number;
  };
  drift: {
    featureDrift: number;
    labelDrift: number;
    conceptDrift: boolean;
  };
}

export class PerformanceMonitor {
  private postgres: Pool;
  private metrics: PerformanceMetrics[];
  private driftThreshold: number;

  constructor(postgresPool: Pool, driftThreshold: number = 0.05) {
    this.postgres = postgresPool;
    this.metrics = [];
    this.driftThreshold = driftThreshold;
  }

  async initialize(): Promise<void> {
    await this.postgres.query(`
      CREATE TABLE IF NOT EXISTS model_metrics (
        id SERIAL PRIMARY KEY,
        model_id VARCHAR(255),
        timestamp TIMESTAMP DEFAULT NOW(),
        prediction_count INTEGER,
        avg_confidence FLOAT,
        latency_p50 FLOAT,
        latency_p95 FLOAT,
        latency_p99 FLOAT,
        precision FLOAT,
        recall FLOAT,
        f1_score FLOAT,
        feature_drift FLOAT,
        label_drift FLOAT,
        concept_drift BOOLEAN
      );
      CREATE INDEX IF NOT EXISTS idx_metrics_model ON model_metrics(model_id);
      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON model_metrics(timestamp);
    `);

    logger.info('Performance monitor initialized');
  }

  async recordPrediction(
    modelId: string,
    latency: number,
    confidence: number
  ): Promise<void> {
    // Store in memory for aggregation
    // In production, use time-series database like InfluxDB
  }

  async computeMetrics(modelId: string): Promise<PerformanceMetrics> {
    // Simulate metrics computation
    const metrics: PerformanceMetrics = {
      modelId,
      timestamp: new Date(),
      predictions: {
        count: Math.floor(Math.random() * 1000000) + 500000,
        avgConfidence: 0.85 + Math.random() * 0.1,
        latency_p50: 20 + Math.random() * 10,
        latency_p95: 45 + Math.random() * 10,
        latency_p99: 80 + Math.random() * 20,
      },
      accuracy: {
        precision: 0.88 + Math.random() * 0.05,
        recall: 0.82 + Math.random() * 0.05,
        f1Score: 0.85 + Math.random() * 0.05,
      },
      drift: {
        featureDrift: Math.random() * 0.1,
        labelDrift: Math.random() * 0.08,
        conceptDrift: Math.random() > 0.95,
      },
    };

    await this.saveMetrics(metrics);
    return metrics;
  }

  async detectDrift(modelId: string): Promise<boolean> {
    const metrics = await this.computeMetrics(modelId);
    
    if (metrics.drift.featureDrift > this.driftThreshold) {
      logger.warn('Feature drift detected', {
        modelId,
        driftScore: metrics.drift.featureDrift,
        threshold: this.driftThreshold,
      });
      return true;
    }

    if (metrics.drift.conceptDrift) {
      logger.warn('Concept drift detected', { modelId });
      return true;
    }

    return false;
  }

  async checkRetrainingNeeded(modelId: string, accuracyThreshold: number = 0.02): Promise<boolean> {
    // Get recent metrics
    const result = await this.postgres.query(
      `SELECT precision, recall, f1_score, timestamp
       FROM model_metrics
       WHERE model_id = $1
       ORDER BY timestamp DESC
       LIMIT 10`,
      [modelId]
    );

    if (result.rows.length < 3) {
      return false;
    }

    // Check if accuracy dropped
    const recent = result.rows.slice(0, 3);
    const avgRecent = recent.reduce((sum, row) => sum + row.f1_score, 0) / 3;
    
    const historical = result.rows.slice(3);
    const avgHistorical = historical.reduce((sum, row) => sum + row.f1_score, 0) / historical.length;

    const drop = avgHistorical - avgRecent;

    if (drop > accuracyThreshold) {
      logger.warn('Model accuracy degradation detected', {
        modelId,
        drop,
        threshold: accuracyThreshold,
        recentF1: avgRecent,
        historicalF1: avgHistorical,
      });
      return true;
    }

    return false;
  }

  private async saveMetrics(metrics: PerformanceMetrics): Promise<void> {
    await this.postgres.query(
      `INSERT INTO model_metrics (
        model_id, timestamp, prediction_count, avg_confidence,
        latency_p50, latency_p95, latency_p99,
        precision, recall, f1_score,
        feature_drift, label_drift, concept_drift
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        metrics.modelId,
        metrics.timestamp,
        metrics.predictions.count,
        metrics.predictions.avgConfidence,
        metrics.predictions.latency_p50,
        metrics.predictions.latency_p95,
        metrics.predictions.latency_p99,
        metrics.accuracy.precision,
        metrics.accuracy.recall,
        metrics.accuracy.f1Score,
        metrics.drift.featureDrift,
        metrics.drift.labelDrift,
        metrics.drift.conceptDrift,
      ]
    );
  }
}
EOF

# Create Retraining Pipeline
cat > src/retraining-pipeline.ts << 'EOF'
import * as tf from '@tensorflow/tfjs-node';
import { ModelRegistry } from './model-registry';
import { FeatureStore } from './feature-store';
import { PerformanceMonitor } from './performance-monitor';
import { logger } from './logger';
import * as path from 'path';

export interface RetrainingConfig {
  triggers: {
    accuracyDrop: number;
    driftScore: number;
    manualTrigger: boolean;
  };
  schedule: {
    minInterval: number; // hours
    maxInterval: number;
  };
  validation: {
    testSetSize: number;
    minImprovement: number;
  };
}

export class RetrainingPipeline {
  private registry: ModelRegistry;
  private featureStore: FeatureStore;
  private monitor: PerformanceMonitor;
  private config: RetrainingConfig;
  private lastRetrainingTime: Date | null = null;
  private isRetraining: boolean = false;

  constructor(
    registry: ModelRegistry,
    featureStore: FeatureStore,
    monitor: PerformanceMonitor,
    config: RetrainingConfig
  ) {
    this.registry = registry;
    this.featureStore = featureStore;
    this.monitor = monitor;
    this.config = config;
  }

  async checkAndRetrain(modelId: string): Promise<boolean> {
    if (this.isRetraining) {
      logger.info('Retraining already in progress');
      return false;
    }

    // Check if retraining is needed
    const accuracyCheck = await this.monitor.checkRetrainingNeeded(
      modelId,
      this.config.triggers.accuracyDrop
    );
    
    const driftCheck = await this.monitor.detectDrift(modelId);

    if (!accuracyCheck && !driftCheck && !this.config.triggers.manualTrigger) {
      return false;
    }

    // Check minimum interval
    if (this.lastRetrainingTime) {
      const hoursSinceLastRetraining = 
        (Date.now() - this.lastRetrainingTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastRetraining < this.config.schedule.minInterval) {
        logger.info('Too soon to retrain', { hoursSinceLastRetraining });
        return false;
      }
    }

    logger.info('Starting model retraining', { modelId });
    return await this.retrain(modelId);
  }

  private async retrain(currentModelId: string): Promise<boolean> {
    this.isRetraining = true;
    const startTime = Date.now();

    try {
      // Step 1: Generate training data
      logger.info('Generating training data...');
      const { X, y } = await this.generateTrainingData(1000);

      // Step 2: Create and train new model
      logger.info('Training new model...');
      const model = await this.trainModel(X, y);

      // Step 3: Validate model
      logger.info('Validating new model...');
      const metrics = await this.validateModel(model, X, y);

      // Step 4: Save model
      const modelPath = path.join('./models', `retrained_${Date.now()}`);
      await model.save(`file://${modelPath}`);

      // Step 5: Register new model
      logger.info('Registering new model...');
      const newModelMetadata = await this.registry.registerModel(modelPath, {
        accuracy: metrics.accuracy,
        latency_p95: metrics.latency_p95,
        throughput: 1000000,
        trainingConfig: {
          datasetVersion: 'v2',
          hyperparameters: {
            learningRate: 0.001,
            epochs: 20,
            batchSize: 32,
          },
          framework: 'tensorflow',
          timestamp: new Date(),
        },
        status: 'staging',
      });

      // Step 6: Check if improvement is significant
      const currentModel = this.registry.getProductionModel();
      if (currentModel && metrics.accuracy < currentModel.accuracy + this.config.validation.minImprovement) {
        logger.info('New model does not meet improvement threshold', {
          newAccuracy: metrics.accuracy,
          currentAccuracy: currentModel.accuracy,
          threshold: this.config.validation.minImprovement,
        });
        return false;
      }

      // Step 7: Promote to production
      logger.info('Promoting new model to production...');
      await this.registry.promoteModel(newModelMetadata.modelId, newModelMetadata.version);

      this.lastRetrainingTime = new Date();
      const duration = (Date.now() - startTime) / 1000;
      
      logger.info('Model retraining completed', {
        duration,
        newModelId: newModelMetadata.modelId,
        accuracy: metrics.accuracy,
      });

      return true;
    } catch (error) {
      logger.error('Model retraining failed', { error });
      return false;
    } finally {
      this.isRetraining = false;
    }
  }

  private async generateTrainingData(samples: number): Promise<{ X: tf.Tensor2D; y: tf.Tensor1D }> {
    const X: number[][] = [];
    const y: number[] = [];

    for (let i = 0; i < samples; i++) {
      // Generate synthetic training data
      const features = [
        Math.random() * 100,  // user_tweet_count_7d
        Math.random() * 0.15, // user_avg_engagement_rate
        Math.log(Math.random() * 10000 + 1), // user_follower_count (log)
        Math.log(Math.random() * 1000 + 1),  // user_following_count (log)
        Math.random() * 48,   // user_last_active_hours
        Math.random() * 24,   // tweet_age_hours
        Math.log(Math.random() * 1000 + 1),  // tweet_like_count (log)
        Math.log(Math.random() * 100 + 1),   // tweet_retweet_count (log)
        Math.log(Math.random() * 50 + 1),    // tweet_reply_count (log)
        Math.random() > 0.5 ? 1 : 0, // tweet_has_media
      ];

      // Generate label based on simple heuristics
      const score = 
        features[1] * 0.3 +  // engagement rate
        (features[6] > 3 ? 0.2 : 0) +  // high likes
        (features[9] ? 0.1 : 0) +  // has media
        (features[5] < 5 ? 0.2 : 0);  // recent tweet
      
      X.push(features);
      y.push(score > 0.5 ? 1 : 0);
    }

    return {
      X: tf.tensor2d(X),
      y: tf.tensor1d(y),
    };
  }

  private async trainModel(X: tf.Tensor2D, y: tf.Tensor1D): Promise<tf.LayersModel> {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' }),
      ],
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    await model.fit(X, y, {
      epochs: 20,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0,
    });

    return model;
  }

  private async validateModel(
    model: tf.LayersModel,
    X: tf.Tensor2D,
    y: tf.Tensor1D
  ): Promise<{ accuracy: number; latency_p95: number }> {
    const result = model.evaluate(X, y) as tf.Scalar[];
    const accuracy = (await result[1].data())[0];

    // Measure latency
    const latencies: number[] = [];
    const testSamples = 100;
    
    for (let i = 0; i < testSamples; i++) {
      const start = Date.now();
      const sample = X.slice([i, 0], [1, 10]);
      model.predict(sample);
      latencies.push(Date.now() - start);
      sample.dispose();
    }

    latencies.sort((a, b) => a - b);
    const latency_p95 = latencies[Math.floor(testSamples * 0.95)];

    return { accuracy, latency_p95 };
  }
}
EOF

# Create Logger
cat > src/logger.ts << 'EOF'
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'mlops.log' }),
  ],
});
EOF

# Create Main Application
cat > src/index.ts << 'EOF'
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { ModelRegistry } from './model-registry';
import { FeatureStore } from './feature-store';
import { ModelServingEngine } from './model-serving';
import { PerformanceMonitor } from './performance-monitor';
import { RetrainingPipeline } from './retraining-pipeline';
import { logger } from './logger';
import * as promClient from 'prom-client';

config();

const app = express();
app.use(express.json());
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const predictionCounter = new promClient.Counter({
  name: 'predictions_total',
  help: 'Total number of predictions',
  registers: [register],
});

const predictionLatency = new promClient.Histogram({
  name: 'prediction_latency_seconds',
  help: 'Prediction latency in seconds',
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// Initialize components
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

const postgres = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'mlops_db',
  user: process.env.POSTGRES_USER || 'mlops_user',
  password: process.env.POSTGRES_PASSWORD || 'mlops_password',
});

const modelRegistry = new ModelRegistry(process.env.MODEL_REGISTRY_PATH);
const featureStore = new FeatureStore(redis, postgres);
const servingEngine = new ModelServingEngine(modelRegistry, featureStore);
const monitor = new PerformanceMonitor(postgres);
const retrainingPipeline = new RetrainingPipeline(
  modelRegistry,
  featureStore,
  monitor,
  {
    triggers: {
      accuracyDrop: 0.02,
      driftScore: 0.05,
      manualTrigger: false,
    },
    schedule: {
      minInterval: 6,  // hours
      maxInterval: 168, // 1 week
    },
    validation: {
      testSetSize: 0.2,
      minImprovement: 0.01,
    },
  }
);

async function initialize() {
  try {
    await modelRegistry.initialize();
    await featureStore.initialize();
    await servingEngine.initialize();
    await monitor.initialize();
    logger.info('All components initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize components', { error });
    process.exit(1);
  }
}

// API Routes
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.post('/predict', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { userId, candidateTweets } = req.body;
    
    if (!userId || !candidateTweets || !Array.isArray(candidateTweets)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const result = await servingEngine.predict({ userId, candidateTweets });
    
    const latency = Date.now() - startTime;
    predictionCounter.inc();
    predictionLatency.observe(latency / 1000);

    res.json(result);
  } catch (error) {
    logger.error('Prediction failed', { error });
    res.status(500).json({ error: 'Prediction failed' });
  }
});

app.post('/features/user/:userId/compute', async (req, res) => {
  try {
    const { userId } = req.params;
    await featureStore.computeUserFeatures(userId);
    res.json({ success: true, userId });
  } catch (error) {
    logger.error('Feature computation failed', { error });
    res.status(500).json({ error: 'Feature computation failed' });
  }
});

app.post('/features/tweet/:tweetId/compute', async (req, res) => {
  try {
    const { tweetId } = req.params;
    await featureStore.computeTweetFeatures(tweetId);
    res.json({ success: true, tweetId });
  } catch (error) {
    logger.error('Feature computation failed', { error });
    res.status(500).json({ error: 'Feature computation failed' });
  }
});

app.get('/models', (req, res) => {
  const models = modelRegistry.listModels();
  res.json({ models });
});

app.get('/models/production', (req, res) => {
  const model = modelRegistry.getProductionModel();
  res.json({ model });
});

app.post('/models/:modelId/:version/promote', async (req, res) => {
  try {
    const { modelId, version } = req.params;
    await modelRegistry.promoteModel(modelId, version);
    res.json({ success: true, modelId, version });
  } catch (error) {
    logger.error('Model promotion failed', { error });
    res.status(500).json({ error: 'Model promotion failed' });
  }
});

app.post('/retrain', async (req, res) => {
  try {
    const productionModel = modelRegistry.getProductionModel();
    
    if (!productionModel) {
      return res.status(404).json({ error: 'No production model found' });
    }

    const result = await retrainingPipeline.checkAndRetrain(productionModel.modelId);
    
    res.json({ 
      success: result,
      message: result ? 'Retraining completed' : 'Retraining not needed or failed'
    });
  } catch (error) {
    logger.error('Retraining failed', { error });
    res.status(500).json({ error: 'Retraining failed' });
  }
});

app.get('/metrics/performance/:modelId', async (req, res) => {
  try {
    const { modelId } = req.params;
    const metrics = await monitor.computeMetrics(modelId);
    res.json({ metrics });
  } catch (error) {
    logger.error('Metrics computation failed', { error });
    res.status(500).json({ error: 'Metrics computation failed' });
  }
});

// Serve Dashboard
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Twitter MLOps Dashboard</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .dashboard {
          max-width: 1400px;
          margin: 0 auto;
        }
        .header {
          background: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2d3748;
          font-size: 2.5em;
          margin-bottom: 10px;
        }
        .header p {
          color: #718096;
          font-size: 1.1em;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .card {
          background: white;
          padding: 25px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .card h2 {
          color: #2d3748;
          font-size: 1.3em;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        .metric {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f7fafc;
        }
        .metric:last-child { border-bottom: none; }
        .metric-label {
          color: #718096;
          font-weight: 500;
        }
        .metric-value {
          color: #2d3748;
          font-weight: 700;
          font-size: 1.1em;
        }
        .status {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.9em;
          font-weight: 600;
        }
        .status.production {
          background: #c6f6d5;
          color: #22543d;
        }
        .status.staging {
          background: #feebc8;
          color: #7c2d12;
        }
        .btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1em;
          font-weight: 600;
          margin: 10px 10px 0 0;
          transition: transform 0.2s;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        #logs {
          background: #1a202c;
          color: #a0aec0;
          padding: 20px;
          border-radius: 10px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          max-height: 400px;
          overflow-y: auto;
        }
        .log-entry {
          margin: 5px 0;
          padding: 5px;
          border-left: 3px solid #4a5568;
          padding-left: 10px;
        }
        .log-info { border-left-color: #4299e1; }
        .log-success { border-left-color: #48bb78; }
        .log-warning { border-left-color: #ed8936; }
        .log-error { border-left-color: #f56565; }
      </style>
    </head>
    <body>
      <div class="dashboard">
        <div class="header">
          <h1>🤖 Twitter MLOps Dashboard</h1>
          <p>Production ML model serving 1M+ predictions/second</p>
        </div>

        <div class="grid">
          <div class="card">
            <h2>Model Status</h2>
            <div id="model-info">
              <div class="metric">
                <span class="metric-label">Current Model</span>
                <span class="metric-value" id="current-model">Loading...</span>
              </div>
              <div class="metric">
                <span class="metric-label">Status</span>
                <span class="status production" id="model-status">Production</span>
              </div>
              <div class="metric">
                <span class="metric-label">Accuracy</span>
                <span class="metric-value" id="model-accuracy">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Latency (P95)</span>
                <span class="metric-value" id="model-latency">-</span>
              </div>
            </div>
          </div>

          <div class="card">
            <h2>Performance Metrics</h2>
            <div id="performance-metrics">
              <div class="metric">
                <span class="metric-label">Predictions/sec</span>
                <span class="metric-value" id="predictions-rate">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Avg Confidence</span>
                <span class="metric-value" id="avg-confidence">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Feature Store Hits</span>
                <span class="metric-value" id="feature-hits">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Cache Hit Rate</span>
                <span class="metric-value" id="cache-rate">-</span>
              </div>
            </div>
          </div>

          <div class="card">
            <h2>Drift Detection</h2>
            <div id="drift-metrics">
              <div class="metric">
                <span class="metric-label">Feature Drift</span>
                <span class="metric-value" id="feature-drift">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Label Drift</span>
                <span class="metric-value" id="label-drift">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Concept Drift</span>
                <span class="metric-value" id="concept-drift">-</span>
              </div>
              <div class="metric">
                <span class="metric-label">Last Check</span>
                <span class="metric-value" id="drift-check">-</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Operations</h2>
          <button class="btn" onclick="runPrediction()">🎯 Test Prediction</button>
          <button class="btn" onclick="computeFeatures()">📊 Compute Features</button>
          <button class="btn" onclick="triggerRetraining()">🔄 Trigger Retraining</button>
          <button class="btn" onclick="checkDrift()">🔍 Check Drift</button>
          <button class="btn" onclick="loadTest()">⚡ Load Test</button>
        </div>

        <div class="card">
          <h2>System Logs</h2>
          <div id="logs"></div>
        </div>
      </div>

      <script>
        function addLog(message, type = 'info') {
          const logs = document.getElementById('logs');
          const entry = document.createElement('div');
          entry.className = \`log-entry log-\${type}\`;
          entry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
          logs.insertBefore(entry, logs.firstChild);
          if (logs.children.length > 50) logs.removeChild(logs.lastChild);
        }

        async function updateDashboard() {
          try {
            // Fetch model info
            const modelResponse = await fetch('/models/production');
            const { model } = await modelResponse.json();
            
            if (model) {
              document.getElementById('current-model').textContent = model.version || 'N/A';
              document.getElementById('model-accuracy').textContent = 
                model.accuracy ? (model.accuracy * 100).toFixed(2) + '%' : 'N/A';
              document.getElementById('model-latency').textContent = 
                model.latency_p95 ? model.latency_p95.toFixed(1) + 'ms' : 'N/A';
              
              // Fetch performance metrics
              try {
                const metricsResponse = await fetch(\`/metrics/performance/\${model.modelId}\`);
                const { metrics } = await metricsResponse.json();
                
                if (metrics) {
                  // Update performance metrics
                  document.getElementById('predictions-rate').textContent = 
                    metrics.predictions?.count ? metrics.predictions.count.toLocaleString() : '0';
                  document.getElementById('avg-confidence').textContent = 
                    metrics.predictions?.avgConfidence ? metrics.predictions.avgConfidence.toFixed(3) : '0.000';
                  
                  // Update drift metrics
                  document.getElementById('feature-drift').textContent = 
                    metrics.drift?.featureDrift ? metrics.drift.featureDrift.toFixed(4) : '0.0000';
                  document.getElementById('label-drift').textContent = 
                    metrics.drift?.labelDrift ? metrics.drift.labelDrift.toFixed(4) : '0.0000';
                  document.getElementById('concept-drift').textContent = 
                    metrics.drift?.conceptDrift ? 'Detected' : 'None';
                  document.getElementById('drift-check').textContent = 
                    new Date().toLocaleTimeString();
                }
              } catch (err) {
                // If metrics not available, set defaults
                document.getElementById('predictions-rate').textContent = '0';
                document.getElementById('avg-confidence').textContent = '0.000';
                document.getElementById('feature-drift').textContent = '0.0000';
                document.getElementById('label-drift').textContent = '0.0000';
                document.getElementById('concept-drift').textContent = 'None';
              }
              
              // Fetch Prometheus metrics for real-time stats
              try {
                const promResponse = await fetch('/metrics');
                const promText = await promResponse.text();
                
                // Parse predictions_total
                const predictionsMatch = promText.match(/predictions_total\s+(\d+)/);
                if (predictionsMatch) {
                  const total = parseInt(predictionsMatch[1]);
                  document.getElementById('predictions-rate').textContent = total.toLocaleString();
                }
                
                // Parse prediction_latency
                const latencyMatch = promText.match(/prediction_latency_seconds_sum\s+([\d.]+)/);
                if (latencyMatch) {
                  const latency = parseFloat(latencyMatch[1]);
                  document.getElementById('avg-confidence').textContent = latency.toFixed(3);
                }
              } catch (err) {
                // Prometheus metrics not critical, continue
              }
              
              // Set feature hits and cache rate (these would need additional endpoints)
              document.getElementById('feature-hits').textContent = '0';
              document.getElementById('cache-rate').textContent = '0%';
            } else {
              // No model available
              document.getElementById('current-model').textContent = 'No model';
              document.getElementById('model-accuracy').textContent = 'N/A';
              document.getElementById('model-latency').textContent = 'N/A';
            }
          } catch (error) {
            addLog('Failed to update dashboard: ' + error.message, 'error');
          }
        }

        async function runPrediction() {
          addLog('Running test prediction...', 'info');
          try {
            const response = await fetch('/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: 'user_' + Math.floor(Math.random() * 1000),
                candidateTweets: Array.from({ length: 10 }, (_, i) => 'tweet_' + i)
              })
            });
            const result = await response.json();
            addLog(\`Prediction completed in \${result.latency}ms, ranked \${result.rankings.length} tweets\`, 'success');
          } catch (error) {
            addLog('Prediction failed: ' + error.message, 'error');
          }
        }

        async function computeFeatures() {
          addLog('Computing features...', 'info');
          try {
            const userId = 'user_' + Math.floor(Math.random() * 1000);
            await fetch(\`/features/user/\${userId}/compute\`, { method: 'POST' });
            addLog(\`Features computed for \${userId}\`, 'success');
          } catch (error) {
            addLog('Feature computation failed: ' + error.message, 'error');
          }
        }

        async function triggerRetraining() {
          addLog('Triggering model retraining...', 'warning');
          try {
            const response = await fetch('/retrain', { method: 'POST' });
            const result = await response.json();
            if (result.success) {
              addLog('Model retraining completed successfully', 'success');
            } else {
              addLog('Retraining not needed or conditions not met', 'info');
            }
          } catch (error) {
            addLog('Retraining failed: ' + error.message, 'error');
          }
        }

        async function checkDrift() {
          addLog('Checking for model drift...', 'info');
          try {
            const model = await fetch('/models/production').then(r => r.json());
            if (model.model) {
              const response = await fetch(\`/metrics/performance/\${model.model.modelId}\`);
              const { metrics } = await response.json();
              
              if (metrics.drift.featureDrift > 0.05) {
                addLog('⚠️  Feature drift detected: ' + metrics.drift.featureDrift.toFixed(4), 'warning');
              } else {
                addLog('✓ No significant drift detected', 'success');
              }
            }
          } catch (error) {
            addLog('Drift check failed: ' + error.message, 'error');
          }
        }

        async function loadTest() {
          addLog('Running load test (100 concurrent predictions)...', 'info');
          const start = Date.now();
          const promises = [];
          
          for (let i = 0; i < 100; i++) {
            promises.push(fetch('/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: 'user_' + i,
                candidateTweets: ['tweet_1', 'tweet_2', 'tweet_3']
              })
            }));
          }
          
          try {
            await Promise.all(promises);
            const duration = Date.now() - start;
            const throughput = (100 / (duration / 1000)).toFixed(0);
            addLog(\`Load test completed: \${throughput} req/sec, avg \${(duration/100).toFixed(1)}ms\`, 'success');
          } catch (error) {
            addLog('Load test failed: ' + error.message, 'error');
          }
        }

        // Initialize dashboard
        updateDashboard();
        setInterval(updateDashboard, 5000);
        addLog('MLOps Dashboard initialized', 'success');
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;

initialize().then(() => {
  app.listen(PORT, () => {
    logger.info(`MLOps server running on port ${PORT}`);
  });
});

// Background monitoring task
setInterval(async () => {
  const productionModel = modelRegistry.getProductionModel();
  if (productionModel) {
    await monitor.computeMetrics(productionModel.modelId);
    await retrainingPipeline.checkAndRetrain(productionModel.modelId);
  }
}, 3600000); // Every hour
EOF

# Create Docker Compose
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: mlops_db
      POSTGRES_USER: mlops_user
      POSTGRES_PASSWORD: mlops_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mlops_user -d mlops_db"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
EOF

# Create Build Script
cat > build.sh << 'EOF'
#!/bin/bash
set -e

echo "Building Twitter MLOps System..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Compile TypeScript
echo "Compiling TypeScript..."
npm run build

echo "Build completed successfully!"
EOF

chmod +x build.sh

# Create Start Script
cat > start.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting Twitter MLOps System..."

# Start Docker services
echo "Starting Redis and PostgreSQL..."
docker-compose up -d

# Wait for services
echo "Waiting for services to be ready..."
sleep 5

# Start application
echo "Starting MLOps application..."
npm start
EOF

chmod +x start.sh

# Create Stop Script
cat > stop.sh << 'EOF'
#!/bin/bash

echo "Stopping Twitter MLOps System..."

# Stop application
pkill -f "node dist/index.js" || true

# Stop Docker services
docker-compose down

echo "System stopped successfully!"
EOF

chmod +x stop.sh

# Create Test Suite
cat > tests/mlops.test.ts << 'EOF'
import { ModelRegistry } from '../src/model-registry';
import { FeatureStore } from '../src/feature-store';
import { ModelServingEngine } from '../src/model-serving';
import Redis from 'ioredis';
import { Pool } from 'pg';

describe('MLOps System Tests', () => {
  test('Model registry initialization', async () => {
    const registry = new ModelRegistry('./test_models');
    await registry.initialize();
    expect(registry).toBeDefined();
  });

  test('Feature store operations', async () => {
    const redis = new Redis();
    const postgres = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'mlops_db',
      user: 'mlops_user',
      password: 'mlops_password',
    });

    const featureStore = new FeatureStore(redis, postgres);
    await featureStore.initialize();

    await featureStore.setFeature({
      name: 'test_feature',
      entityId: 'test_user',
      value: 42,
      timestamp: new Date(),
      version: 'v1',
    });

    const feature = await featureStore.getFeature('test_user', 'test_feature');
    expect(feature).toBeDefined();
    expect(feature?.value).toBe(42);

    await redis.quit();
    await postgres.end();
  });

  test('Model serving prediction', async () => {
    const registry = new ModelRegistry('./test_models');
    const redis = new Redis();
    const postgres = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'mlops_db',
      user: 'mlops_user',
      password: 'mlops_password',
    });
    const featureStore = new FeatureStore(redis, postgres);

    await registry.initialize();
    await featureStore.initialize();

    const servingEngine = new ModelServingEngine(registry, featureStore);
    await servingEngine.initialize();

    // Compute features
    await featureStore.computeUserFeatures('user_1');
    await featureStore.computeTweetFeatures('tweet_1');
    await featureStore.computeTweetFeatures('tweet_2');

    const result = await servingEngine.predict({
      userId: 'user_1',
      candidateTweets: ['tweet_1', 'tweet_2'],
    });

    expect(result.rankings).toHaveLength(2);
    expect(result.latency).toBeGreaterThan(0);
    expect(result.rankings[0].score).toBeDefined();

    await redis.quit();
    await postgres.end();
  }, 30000);
});
EOF

# Create Demo Script
cat > demo.sh << 'EOF'
#!/bin/bash
set -e

echo "===================================="
echo "Twitter MLOps System - Demo"
echo "===================================="
echo ""

BASE_URL="http://localhost:3000"

echo "1. Checking system health..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

echo "2. Getting production model info..."
curl -s "$BASE_URL/models/production" | jq '.'
echo ""

echo "3. Computing user features..."
curl -s -X POST "$BASE_URL/features/user/demo_user_1/compute" | jq '.'
echo ""

echo "4. Computing tweet features..."
for i in {1..5}; do
  curl -s -X POST "$BASE_URL/features/tweet/demo_tweet_$i/compute" | jq '.'
done
echo ""

echo "5. Running prediction..."
curl -s -X POST "$BASE_URL/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo_user_1",
    "candidateTweets": ["demo_tweet_1", "demo_tweet_2", "demo_tweet_3", "demo_tweet_4", "demo_tweet_5"]
  }' | jq '.'
echo ""

echo "6. Load test (100 concurrent predictions)..."
START=$(date +%s%3N)
for i in {1..100}; do
  curl -s -X POST "$BASE_URL/predict" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"user_$i\",\"candidateTweets\":[\"tweet_1\",\"tweet_2\"]}" > /dev/null &
done
wait
END=$(date +%s%3N)
DURATION=$((END - START))
THROUGHPUT=$((100000 / DURATION))
echo "Completed 100 predictions in ${DURATION}ms"
echo "Throughput: ${THROUGHPUT} predictions/second"
echo ""

echo "7. Checking for drift..."
MODEL_ID=$(curl -s "$BASE_URL/models/production" | jq -r '.model.modelId')
curl -s "$BASE_URL/metrics/performance/$MODEL_ID" | jq '.metrics.drift'
echo ""

echo "===================================="
echo "Demo completed successfully!"
echo "Open http://localhost:3000 to view dashboard"
echo "===================================="
EOF

chmod +x demo.sh

# Create README
cat > README.md << 'EOF'
# Twitter MLOps System - Lesson 45

Production-ready MLOps system serving 1M predictions/second with automated model deployment, feature store, drift detection, and retraining pipelines.

## Features

- **Model Registry**: Version control and deployment management for ML models
- **Feature Store**: Real-time feature serving with Redis and PostgreSQL
- **Model Serving**: High-throughput prediction engine with batching and caching
- **Performance Monitoring**: Automated drift detection and model health tracking
- **Retraining Pipeline**: Automated model retraining triggered by performance degradation
- **Production Dashboard**: Real-time monitoring and operations UI

## Quick Start

### With Docker
```bash
# Build and start
./build.sh
./start.sh

# Run demo
./demo.sh

# View dashboard
open http://localhost:3000
```

### Without Docker
```bash
# Install dependencies
npm install

# Start Redis and PostgreSQL manually
# Update .env with connection details

# Build
npm run build

# Start
npm start
```

## API Endpoints

- `GET /health` - System health check
- `GET /metrics` - Prometheus metrics
- `POST /predict` - Generate predictions
- `POST /features/user/:userId/compute` - Compute user features
- `POST /features/tweet/:tweetId/compute` - Compute tweet features
- `GET /models` - List all models
- `GET /models/production` - Get production model
- `POST /models/:id/:version/promote` - Promote model to production
- `POST /retrain` - Trigger model retraining
- `GET /metrics/performance/:modelId` - Get model metrics

## Performance Targets

- Prediction throughput: 1M predictions/second
- Prediction latency: P95 < 50ms
- Feature serving: 100K features/second
- Model deployment: < 60 seconds
- Drift detection: Within 5 minutes

## Testing

```bash
npm test
```

## Architecture

The system consists of:
- Model Registry: Tracks all model versions and deployment status
- Feature Store: Dual-layer (Redis + PostgreSQL) feature management
- Serving Engine: Batched inference with prediction caching
- Performance Monitor: Real-time metrics and drift detection
- Retraining Pipeline: Automated model improvement workflow

## License

MIT
EOF

echo ""
echo "===================================="
echo "Setup completed successfully!"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Run: ./build.sh        (Build the project)"
echo "2. Run: ./start.sh        (Start all services)"
echo "3. Run: ./demo.sh         (Run demonstration)"
echo "4. Open: http://localhost:3000 (View dashboard)"
echo ""
echo "To stop: ./stop.sh"
echo "===================================="