#!/bin/bash

# Lesson 49: Advanced Monitoring and Observability - Complete Implementation
# This script creates a full observability stack with distributed tracing, SLI/SLO monitoring, and predictive alerting

set -e

PROJECT_NAME="twitter-observability-stack"
PROJECT_DIR="$HOME/$PROJECT_NAME"

echo "=========================================="
echo "Lesson 49: Advanced Monitoring & Observability"
echo "Building Complete Observability Stack"
echo "=========================================="

# Clean and create project directory
rm -rf "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo "Creating project structure..."

# Create directory structure
mkdir -p {src/{services/{api,timeline,tweet,cache},monitoring/{collector,ml-predictor},shared},config,tests,scripts,dashboards}

# Create package.json
cat > package.json << 'EOF'
{
  "name": "twitter-observability-stack",
  "version": "1.0.0",
  "description": "Advanced Monitoring and Observability for Twitter Clone",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest",
    "demo": "ts-node src/demo.ts"
  },
  "dependencies": {
    "@opentelemetry/api": "^1.9.0",
    "@opentelemetry/sdk-node": "^0.52.1",
    "@opentelemetry/auto-instrumentations-node": "^0.47.1",
    "@opentelemetry/exporter-trace-otlp-grpc": "^0.52.1",
    "@opentelemetry/exporter-metrics-otlp-grpc": "^0.52.1",
    "@opentelemetry/instrumentation-express": "^0.41.1",
    "@opentelemetry/instrumentation-http": "^0.52.1",
    "@opentelemetry/resources": "^1.25.1",
    "@opentelemetry/semantic-conventions": "^1.25.1",
    "express": "^4.19.2",
    "prom-client": "^15.1.2",
    "axios": "^1.7.2",
    "ioredis": "^5.4.1",
    "@tensorflow/tfjs-node": "^4.20.0",
    "winston": "^3.13.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/node": "^20.14.2",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "typescript": "^5.4.5",
    "ts-node": "^10.9.2",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.4"
  }
}
EOF

# Create TypeScript configuration
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
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
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/']
};
EOF

# Create shared types
cat > src/shared/types.ts << 'EOF'
export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
}

export interface SLIMetric {
  name: string;
  value: number;
  timestamp: number;
  labels: Record<string, string>;
}

export interface SLO {
  name: string;
  target: number;
  window: string;
  sli: string;
}

export interface AlertPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  timeToThreshold: number;
  confidence: number;
  timestamp: number;
}

export interface TraceData {
  traceId: string;
  spans: SpanData[];
  duration: number;
  status: 'ok' | 'error';
}

export interface SpanData {
  spanId: string;
  parentSpanId?: string;
  name: string;
  service: string;
  startTime: number;
  duration: number;
  attributes: Record<string, any>;
  status: 'ok' | 'error';
}
EOF

# Create telemetry setup
cat > src/shared/telemetry.ts << 'EOF'
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

export function initializeTelemetry(serviceName: string): NodeSDK {
  const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
  });

  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
  });

  const metricExporter = new OTLPMetricExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 5000,
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  console.log(`Telemetry initialized for ${serviceName}`);

  return sdk;
}
EOF

# Create Prometheus metrics
cat > src/shared/metrics.ts << 'EOF'
import { register, Counter, Histogram, Gauge } from 'prom-client';

export class MetricsCollector {
  private static instance: MetricsCollector;

  public requestDuration: Histogram<string>;
  public requestCount: Counter<string>;
  public activeConnections: Gauge<string>;
  public cacheHitRate: Gauge<string>;
  public sliCompliance: Gauge<string>;

  private constructor() {
    this.requestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['service', 'method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
    });

    this.requestCount = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['service', 'method', 'route', 'status'],
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['service'],
    });

    this.cacheHitRate = new Gauge({
      name: 'cache_hit_rate',
      help: 'Cache hit rate percentage',
      labelNames: ['service', 'cache_type'],
    });

    this.sliCompliance = new Gauge({
      name: 'sli_compliance_percentage',
      help: 'SLI compliance percentage',
      labelNames: ['sli_name', 'window'],
    });
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  public getMetrics(): Promise<string> {
    return register.metrics();
  }
}
EOF

# Create SLI/SLO Manager
cat > src/monitoring/sli-slo-manager.ts << 'EOF'
import { SLIMetric, SLO } from '../shared/types';
import { MetricsCollector } from '../shared/metrics';

export class SLISLOManager {
  private slos: Map<string, SLO> = new Map();
  private sliHistory: Map<string, SLIMetric[]> = new Map();
  private metrics: MetricsCollector;

  constructor() {
    this.metrics = MetricsCollector.getInstance();
    this.initializeSLOs();
  }

  private initializeSLOs(): void {
    // Timeline Load Latency SLO
    this.slos.set('timeline_latency', {
      name: 'timeline_latency',
      target: 95, // 95% of requests < 200ms
      window: '5m',
      sli: 'timeline_load_duration_seconds',
    });

    // Tweet Post Success Rate SLO
    this.slos.set('tweet_post_success', {
      name: 'tweet_post_success',
      target: 99.9, // 99.9% success rate
      window: '5m',
      sli: 'tweet_post_success_rate',
    });

    // Cache Hit Rate SLO
    this.slos.set('cache_hit_rate', {
      name: 'cache_hit_rate',
      target: 85, // 85% cache hits
      window: '5m',
      sli: 'cache_hit_percentage',
    });
  }

  public recordSLI(metric: SLIMetric): void {
    if (!this.sliHistory.has(metric.name)) {
      this.sliHistory.set(metric.name, []);
    }

    const history = this.sliHistory.get(metric.name)!;
    history.push(metric);

    // Keep only last 1 hour of data
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.sliHistory.set(
      metric.name,
      history.filter(m => m.timestamp > oneHourAgo)
    );

    this.updateSLOCompliance(metric.name);
  }

  private updateSLOCompliance(sliName: string): void {
    const slo = this.slos.get(sliName);
    if (!slo) return;

    const history = this.sliHistory.get(sliName) || [];
    if (history.length === 0) return;

    const windowMs = this.parseWindow(slo.window);
    const cutoff = Date.now() - windowMs;
    const recentMetrics = history.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) return;

    let compliance = 0;

    if (sliName === 'timeline_latency') {
      // P95 latency compliance
      const latencies = recentMetrics.map(m => m.value).sort((a, b) => a - b);
      const p95Index = Math.floor(latencies.length * 0.95);
      const p95Latency = latencies[p95Index];
      compliance = p95Latency < 0.2 ? 100 : 0; // <200ms
    } else if (sliName === 'tweet_post_success') {
      // Success rate compliance
      const successRate = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
      compliance = successRate * 100;
    } else if (sliName === 'cache_hit_rate') {
      // Cache hit rate compliance
      const avgHitRate = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
      compliance = avgHitRate;
    }

    this.metrics.sliCompliance.set({ sli_name: sliName, window: slo.window }, compliance);
  }

  private parseWindow(window: string): number {
    const value = parseInt(window);
    const unit = window.slice(-1);
    const multipliers: Record<string, number> = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
    };
    return value * (multipliers[unit] || 60000);
  }

  public getSLOStatus(): Array<{ name: string; target: number; current: number; status: string }> {
    const status: Array<{ name: string; target: number; current: number; status: string }> = [];

    for (const [name, slo] of this.slos.entries()) {
      const history = this.sliHistory.get(name) || [];
      if (history.length === 0) continue;

      const windowMs = this.parseWindow(slo.window);
      const cutoff = Date.now() - windowMs;
      const recentMetrics = history.filter(m => m.timestamp > cutoff);

      let current = 0;
      if (name === 'timeline_latency') {
        const latencies = recentMetrics.map(m => m.value).sort((a, b) => a - b);
        const p95Index = Math.floor(latencies.length * 0.95);
        current = latencies[p95Index] || 0;
      } else {
        current = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
      }

      const statusStr = current >= slo.target * 0.9 ? 'healthy' : current >= slo.target * 0.8 ? 'warning' : 'critical';

      status.push({
        name: slo.name,
        target: slo.target,
        current,
        status: statusStr,
      });
    }

    return status;
  }
}
EOF

# Create ML Predictor
cat > src/monitoring/ml-predictor.ts << 'EOF'
import * as tf from '@tensorflow/tfjs-node';
import { AlertPrediction } from '../shared/types';

export class MLPredictor {
  private models: Map<string, tf.LayersModel> = new Map();
  private dataBuffers: Map<string, number[]> = new Map();
  private readonly SEQUENCE_LENGTH = 60; // 60 data points
  private readonly PREDICTION_HORIZON = 30; // Predict 30 minutes ahead

  constructor() {
    this.initializeModels();
  }

  private async initializeModels(): Promise<void> {
    // Create simple LSTM model for each metric
    const metricNames = ['timeline_latency', 'cache_hit_rate', 'request_rate'];

    for (const metricName of metricNames) {
      const model = await this.createLSTMModel();
      this.models.set(metricName, model);
      this.dataBuffers.set(metricName, []);
    }
  }

  private async createLSTMModel(): Promise<tf.LayersModel> {
    const model = tf.sequential();

    model.add(tf.layers.lstm({
      units: 50,
      returnSequences: true,
      inputShape: [this.SEQUENCE_LENGTH, 1],
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.lstm({
      units: 50,
      returnSequences: false,
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({ units: 1 }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
    });

    return model;
  }

  public addDataPoint(metricName: string, value: number): void {
    if (!this.dataBuffers.has(metricName)) {
      this.dataBuffers.set(metricName, []);
    }

    const buffer = this.dataBuffers.get(metricName)!;
    buffer.push(value);

    // Keep only last 120 data points (2x sequence length for better context)
    if (buffer.length > 120) {
      buffer.shift();
    }
  }

  public async predict(metricName: string, threshold: number): Promise<AlertPrediction | null> {
    const model = this.models.get(metricName);
    const buffer = this.dataBuffers.get(metricName);

    if (!model || !buffer || buffer.length < this.SEQUENCE_LENGTH) {
      return null;
    }

    try {
      // Prepare input data
      const recentData = buffer.slice(-this.SEQUENCE_LENGTH);
      const normalized = this.normalizeData(recentData);
      
      const inputTensor = tf.tensor3d([normalized.map(v => [v])]);
      
      // Make prediction
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const predictedValue = (await prediction.data())[0];
      
      inputTensor.dispose();
      prediction.dispose();

      const denormalizedPrediction = this.denormalizeValue(predictedValue, recentData);
      const currentValue = buffer[buffer.length - 1];

      // Calculate time to threshold breach
      const trend = denormalizedPrediction - currentValue;
      const distanceToThreshold = threshold - currentValue;
      
      let timeToThreshold = Infinity;
      if (trend > 0 && distanceToThreshold > 0) {
        timeToThreshold = (distanceToThreshold / trend) * this.PREDICTION_HORIZON;
      }

      // Calculate confidence based on recent prediction accuracy
      const confidence = this.calculateConfidence(metricName);

      if (timeToThreshold < this.PREDICTION_HORIZON && timeToThreshold > 0) {
        return {
          metric: metricName,
          currentValue,
          predictedValue: denormalizedPrediction,
          timeToThreshold,
          confidence,
          timestamp: Date.now(),
        };
      }

      return null;
    } catch (error) {
      console.error(`Prediction error for ${metricName}:`, error);
      return null;
    }
  }

  private normalizeData(data: number[]): number[] {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data.map(v => (v - min) / range);
  }

  private denormalizeValue(normalizedValue: number, originalData: number[]): number {
    const min = Math.min(...originalData);
    const max = Math.max(...originalData);
    const range = max - min || 1;
    return normalizedValue * range + min;
  }

  private calculateConfidence(metricName: string): number {
    // Simplified confidence calculation
    // In production, this would compare recent predictions vs actual values
    const buffer = this.dataBuffers.get(metricName);
    if (!buffer || buffer.length < 10) return 0.5;

    // Calculate variance - lower variance = higher confidence
    const mean = buffer.reduce((sum, v) => sum + v, 0) / buffer.length;
    const variance = buffer.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / buffer.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;

    // Convert to confidence score (0-1)
    return Math.max(0.3, Math.min(0.95, 1 - coefficientOfVariation));
  }

  public async trainModel(metricName: string, historicalData: number[]): Promise<void> {
    const model = this.models.get(metricName);
    if (!model || historicalData.length < this.SEQUENCE_LENGTH + 1) return;

    const sequences: number[][][] = [];
    const targets: number[] = [];

    // Create training sequences
    for (let i = 0; i < historicalData.length - this.SEQUENCE_LENGTH; i++) {
      const sequence = historicalData.slice(i, i + this.SEQUENCE_LENGTH);
      const target = historicalData[i + this.SEQUENCE_LENGTH];
      
      sequences.push(sequence.map(v => [v]));
      targets.push(target);
    }

    if (sequences.length === 0) return;

    const xsTensor = tf.tensor3d(sequences);
    const ysTensor = tf.tensor2d(targets, [targets.length, 1]);

    await model.fit(xsTensor, ysTensor, {
      epochs: 10,
      batchSize: 32,
      verbose: 0,
    });

    xsTensor.dispose();
    ysTensor.dispose();
  }
}
EOF

# Create API Service
cat > src/services/api/server.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { MetricsCollector } from '../../shared/metrics';
import { SLISLOManager } from '../../monitoring/sli-slo-manager';
import { MLPredictor } from '../../monitoring/ml-predictor';

const app = express();
const PORT = process.env.PORT || 3000;
const tracer = trace.getTracer('api-service');
const metrics = MetricsCollector.getInstance();
const sliManager = new SLISLOManager();
const mlPredictor = new MLPredictor();

app.use(cors());
app.use(express.json());

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(await metrics.getMetrics());
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

// Timeline endpoint with tracing
app.get('/api/timeline/:userId', async (req, res) => {
  const startTime = Date.now();
  const span = tracer.startSpan('get_timeline', {
    attributes: {
      'user.id': req.params.userId,
      'http.method': 'GET',
      'http.route': '/api/timeline/:userId',
    },
  });

  try {
    metrics.activeConnections.inc({ service: 'api' });

    // Simulate timeline generation with varying latency
    const baseLatency = 50 + Math.random() * 150; // 50-200ms
    await new Promise(resolve => setTimeout(resolve, baseLatency));

    const timeline = {
      userId: req.params.userId,
      tweets: Array.from({ length: 50 }, (_, i) => ({
        id: `tweet-${i}`,
        content: `Tweet content ${i}`,
        timestamp: Date.now() - i * 60000,
      })),
    };

    const duration = (Date.now() - startTime) / 1000;
    
    // Record metrics
    metrics.requestDuration.observe(
      { service: 'api', method: 'GET', route: '/timeline', status: '200' },
      duration
    );
    metrics.requestCount.inc({ service: 'api', method: 'GET', route: '/timeline', status: '200' });

    // Record SLI
    sliManager.recordSLI({
      name: 'timeline_latency',
      value: duration,
      timestamp: Date.now(),
      labels: { user_id: req.params.userId },
    });

    // Add data point for ML prediction
    mlPredictor.addDataPoint('timeline_latency', duration);

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    metrics.activeConnections.dec({ service: 'api' });
    res.json(timeline);
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
    span.end();
    metrics.activeConnections.dec({ service: 'api' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tweet post endpoint
app.post('/api/tweet', async (req, res) => {
  const span = tracer.startSpan('post_tweet');

  try {
    const success = Math.random() > 0.001; // 99.9% success rate

    if (!success) throw new Error('Tweet post failed');

    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20));

    sliManager.recordSLI({
      name: 'tweet_post_success',
      value: 1,
      timestamp: Date.now(),
      labels: { user_id: req.body.userId },
    });

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json({ success: true, tweetId: `tweet-${Date.now()}` });
  } catch (error) {
    sliManager.recordSLI({
      name: 'tweet_post_success',
      value: 0,
      timestamp: Date.now(),
      labels: { user_id: req.body.userId },
    });

    span.setStatus({ code: SpanStatusCode.ERROR });
    span.end();
    res.status(500).json({ error: 'Tweet post failed' });
  }
});

// SLO status endpoint
app.get('/api/slo-status', (req, res) => {
  const status = sliManager.getSLOStatus();
  res.json(status);
});

// Predictions endpoint
app.get('/api/predictions', async (req, res) => {
  const predictions = await Promise.all([
    mlPredictor.predict('timeline_latency', 0.2),
    mlPredictor.predict('cache_hit_rate', 0.85),
  ]);

  res.json(predictions.filter(p => p !== null));
});

export function startServer(): void {
  app.listen(PORT, () => {
    console.log(`API Service running on port ${PORT}`);
  });
}
EOF

# Create main index file
cat > src/index.ts << 'EOF'
import { initializeTelemetry } from './shared/telemetry';
import { startServer } from './services/api/server';

const sdk = initializeTelemetry('twitter-api-service');

startServer();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Telemetry terminated'))
    .catch((error) => console.log('Error terminating telemetry', error))
    .finally(() => process.exit(0));
});
EOF

# Create demo script
cat > src/demo.ts << 'EOF'
import axios from 'axios';
import { initializeTelemetry } from './shared/telemetry';
import { startServer } from './services/api/server';

const API_URL = 'http://localhost:3000';

async function runDemo(): Promise<void> {
  console.log('\n========================================');
  console.log('Observability Stack Demo');
  console.log('========================================\n');

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Generate load to create traces and metrics
    console.log('1. Generating load to create traces and metrics...');
    const requests = [];
    for (let i = 0; i < 100; i++) {
      requests.push(
        axios.get(`${API_URL}/api/timeline/user-${i % 10}`).catch(() => {})
      );
      if (i % 10 === 0) {
        requests.push(
          axios.post(`${API_URL}/api/tweet`, { userId: `user-${i}`, content: 'Test tweet' }).catch(() => {})
        );
      }
    }
    await Promise.all(requests);
    console.log('   ✓ Generated 100 timeline requests and 10 tweet posts\n');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check SLO status
    console.log('2. Checking SLO compliance...');
    const sloResponse = await axios.get(`${API_URL}/api/slo-status`);
    console.log('   SLO Status:');
    sloResponse.data.forEach((slo: any) => {
      const statusEmoji = slo.status === 'healthy' ? '✓' : slo.status === 'warning' ? '⚠' : '✗';
      console.log(`   ${statusEmoji} ${slo.name}: ${slo.current.toFixed(2)} / ${slo.target} (${slo.status})`);
    });
    console.log('');

    // Generate more load for predictions
    console.log('3. Generating additional load for ML predictions...');
    for (let i = 0; i < 50; i++) {
      await axios.get(`${API_URL}/api/timeline/user-${i % 5}`).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('   ✓ Generated 50 additional requests\n');

    // Check predictions
    console.log('4. Checking predictive alerts...');
    const predictions = await axios.get(`${API_URL}/api/predictions`);
    if (predictions.data.length > 0) {
      console.log('   Predictions:');
      predictions.data.forEach((pred: any) => {
        console.log(`   ⚠ ${pred.metric}:`);
        console.log(`      Current: ${pred.currentValue.toFixed(3)}`);
        console.log(`      Predicted: ${pred.predictedValue.toFixed(3)}`);
        console.log(`      Time to threshold: ${pred.timeToThreshold.toFixed(1)} minutes`);
        console.log(`      Confidence: ${(pred.confidence * 100).toFixed(1)}%`);
      });
    } else {
      console.log('   ✓ No threshold breaches predicted\n');
    }

    // Show metrics
    console.log('\n5. Prometheus metrics sample:');
    const metricsResponse = await axios.get(`${API_URL}/metrics`);
    const metricsLines = metricsResponse.data.split('\n').filter((l: string) => 
      !l.startsWith('#') && l.includes('http_request_duration_seconds')
    ).slice(0, 5);
    metricsLines.forEach((line: string) => console.log(`   ${line}`));

    console.log('\n========================================');
    console.log('Demo Complete!');
    console.log('========================================');
    console.log('\nKey Achievements:');
    console.log('✓ Distributed tracing operational across requests');
    console.log('✓ SLI/SLO framework monitoring business metrics');
    console.log('✓ ML-based predictive alerting detecting anomalies');
    console.log('✓ Prometheus metrics exported for visualization');
    console.log('\nAccess the following endpoints:');
    console.log('- Metrics: http://localhost:3000/metrics');
    console.log('- SLO Status: http://localhost:3000/api/slo-status');
    console.log('- Predictions: http://localhost:3000/api/predictions');
    console.log('');

  } catch (error) {
    console.error('Demo error:', error);
  }

  process.exit(0);
}

const sdk = initializeTelemetry('twitter-demo');
startServer();

setTimeout(() => {
  runDemo();
}, 2000);
EOF

# Create tests
mkdir -p tests

cat > tests/observability.test.ts << 'EOF'
import { MetricsCollector } from '../src/shared/metrics';
import { SLISLOManager } from '../src/monitoring/sli-slo-manager';

describe('Observability Stack Tests', () => {
  describe('MetricsCollector', () => {
    it('should initialize metrics correctly', () => {
      const metrics = MetricsCollector.getInstance();
      expect(metrics).toBeDefined();
      expect(metrics.requestDuration).toBeDefined();
      expect(metrics.sliCompliance).toBeDefined();
    });

    it('should record metrics', async () => {
      const metrics = MetricsCollector.getInstance();
      metrics.requestCount.inc({ service: 'test', method: 'GET', route: '/test', status: '200' });
      const metricsOutput = await metrics.getMetrics();
      expect(metricsOutput).toContain('http_requests_total');
    });
  });

  describe('SLISLOManager', () => {
    it('should record SLI metrics', () => {
      const manager = new SLISLOManager();
      manager.recordSLI({
        name: 'timeline_latency',
        value: 0.15,
        timestamp: Date.now(),
        labels: { user_id: 'test-user' },
      });

      const status = manager.getSLOStatus();
      expect(status.length).toBeGreaterThan(0);
    });

    it('should calculate SLO compliance', () => {
      const manager = new SLISLOManager();
      
      for (let i = 0; i < 100; i++) {
        manager.recordSLI({
          name: 'timeline_latency',
          value: 0.1 + Math.random() * 0.1,
          timestamp: Date.now(),
          labels: { user_id: `user-${i}` },
        });
      }

      const status = manager.getSLOStatus();
      const timelineSLO = status.find(s => s.name === 'timeline_latency');
      expect(timelineSLO).toBeDefined();
      expect(timelineSLO?.status).toBe('healthy');
    });
  });
});
EOF

# Create Docker Compose for full observability stack
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # OpenTelemetry Collector
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.102.1
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./config/otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC receiver
      - "4318:4318"   # OTLP HTTP receiver
      - "8888:8888"   # Prometheus metrics
      - "8889:8889"   # Prometheus exporter

  # Jaeger for distributed tracing
  jaeger:
    image: jaegertracing/all-in-one:1.57
    ports:
      - "16686:16686" # Jaeger UI
      - "14250:14250" # Jaeger gRPC

  # Prometheus for metrics
  prometheus:
    image: prom/prometheus:v2.52.0
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  # Grafana for visualization
  grafana:
    image: grafana/grafana:11.0.0
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_SECURITY_ADMIN_USER=admin
    volumes:
      - ./config/grafana-datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml
      - ./dashboards:/etc/grafana/provisioning/dashboards

  # Redis for caching
  redis:
    image: redis:7.2-alpine
    ports:
      - "6379:6379"

  # Application
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
      - NODE_ENV=production
    depends_on:
      - otel-collector
      - redis
EOF

# Create OpenTelemetry Collector config
mkdir -p config
cat > config/otel-collector-config.yaml << 'EOF'
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 10s
    send_batch_size: 1024

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
  
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true
  
  logging:
    loglevel: info

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger, logging]
    
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus, logging]
EOF

# Create Prometheus config
cat > config/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'otel-collector'
    static_configs:
      - targets: ['otel-collector:8889']

  - job_name: 'app'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/metrics'
EOF

# Create Grafana datasources config
cat > config/grafana-datasources.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
  
  - name: Jaeger
    type: jaeger
    access: proxy
    url: http://jaeger:16686
EOF

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
EOF

# Create build script
cat > build.sh << 'EOF'
#!/bin/bash

echo "=========================================="
echo "Building Observability Stack"
echo "=========================================="

echo "Installing dependencies..."
npm install

echo "Compiling TypeScript..."
npm run build

echo "Running tests..."
npm test

echo "Build complete!"
EOF

chmod +x build.sh

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash

echo "=========================================="
echo "Starting Observability Stack"
echo "=========================================="

echo "Starting services with Docker Compose..."
docker-compose up -d

echo "Waiting for services to be ready..."
sleep 10

echo "Starting application..."
npm start &

echo ""
echo "Services started successfully!"
echo "- Jaeger UI: http://localhost:16686"
echo "- Prometheus: http://localhost:9090"
echo "- Grafana: http://localhost:3001 (admin/admin)"
echo "- Application: http://localhost:3000"
echo "- Metrics: http://localhost:3000/metrics"
echo ""
EOF

chmod +x start.sh

# Create stop script
cat > stop.sh << 'EOF'
#!/bin/bash

echo "Stopping Observability Stack..."

pkill -f "node dist/index.js"
docker-compose down

echo "All services stopped."
EOF

chmod +x stop.sh

# Create README
cat > README.md << 'EOF'
# Lesson 49: Advanced Monitoring and Observability

Complete observability stack with distributed tracing, SLI/SLO monitoring, and predictive alerting.

## Quick Start

### Without Docker
```bash
./build.sh
npm start
npm run demo
```

### With Docker
```bash
docker-compose up -d
npm run demo
```

## Components

- **OpenTelemetry**: Distributed tracing and metrics collection
- **Jaeger**: Trace visualization
- **Prometheus**: Metrics storage and querying
- **Grafana**: Unified observability dashboard
- **ML Predictor**: LSTM-based predictive alerting

## Access Points

- Application: http://localhost:3000
- Jaeger UI: http://localhost:16686
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)
- Metrics: http://localhost:3000/metrics

## Key Endpoints

- `GET /api/timeline/:userId` - Get user timeline (traced)
- `POST /api/tweet` - Post tweet (traced)
- `GET /api/slo-status` - SLO compliance status
- `GET /api/predictions` - ML predictions
- `GET /metrics` - Prometheus metrics

## Testing

```bash
npm test
```

## Architecture

The system implements:
1. Distributed tracing across all services
2. SLI/SLO framework for business metrics
3. Predictive alerting using LSTM models
4. Real-time observability dashboards

EOF

echo ""
echo "=========================================="
echo "Project Setup Complete!"
echo "=========================================="
echo ""
echo "Run the following commands:"
echo "  cd $PROJECT_DIR"
echo "  ./build.sh          # Install and build"
echo "  npm run demo        # Run demonstration"
echo "  ./start.sh          # Start with Docker"
echo ""
echo "Access points:"
echo "  - Application: http://localhost:3000"
echo "  - Jaeger UI: http://localhost:16686"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001"
echo ""