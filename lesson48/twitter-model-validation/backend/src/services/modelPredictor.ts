import { ModelPrediction, ModelConfig } from '../types/index.js';

export class ModelPredictor {
  private models: Map<string, ModelConfig> = new Map();

  constructor() {
    this.initializeModels();
  }

  private initializeModels() {
    // Timeline Latency Model (Queuing Theory - M/M/1)
    this.addModel({
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
    this.addModel({
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
    this.addModel({
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

  addModel(model: ModelConfig) {
    this.models.set(model.name, model);
  }

  getModelNames(): string[] {
    return Array.from(this.models.values())
      .filter(model => model.enabled)
      .map(model => model.name);
  }

  private predictTimelineLatency(arrivalRate: number, model: ModelConfig): number {
    const serviceRate = model.parameters.serviceRate;
    const avgServiceTime = model.parameters.avgServiceTime ?? 0.01;

    // M/M/1 Queue: L = λ / (μ - λ)
    const utilization = arrivalRate / serviceRate;

    if (utilization >= 1) {
      return 999; // System overload
    }

    // Average response time: W = 1 / (μ - λ)
    const avgResponseTime = 1 / (serviceRate - arrivalRate);

    // P95 is approximately 3x average for M/M/1
    return avgResponseTime * 3 * 1000 + avgServiceTime;
  }

  private predictCacheHitRate(
    requestCount: number,
    uniqueItems: number,
    model: ModelConfig
  ): number {
    const cacheSize = model.parameters.cacheSize || 1;
    const alpha = model.parameters.zipfAlpha || 0.8;

    // Simplified Zipf distribution model
    const workingSetRatio = Math.min(uniqueItems / cacheSize, 1);
    const baseHitRate = 1 - Math.pow(workingSetRatio, alpha);

    // Adjust for request count (cache warming effect)
    const warmingFactor = Math.min(requestCount / 1000, 1);

    return baseHitRate * warmingFactor * 100;
  }

  private predictQueueDepth(arrivalRate: number, serviceRate: number): number {
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
    const model = this.models.get(modelName);
    const now = Date.now();
    const timeWindow = {
      start: now,
      end: now + 60000 // 1 minute window
    };

    const basePrediction: ModelPrediction = {
      id: `pred_${now}_${modelName}`,
      modelName,
      modelVersion: model?.version || '1.0',
      timestamp: now,
      timeWindow,
      predictions: []
    };

    if (!model || !model.enabled) {
      return basePrediction;
    }

    switch (model.type) {
      case 'latency':
        return {
          ...basePrediction,
          predictions: [{
            metricName: 'p95_latency_ms',
            predictedValue: this.predictTimelineLatency(currentMetrics.arrivalRate, model),
            confidence: 0.92
          }]
        };
      case 'cache':
        return {
          ...basePrediction,
          predictions: [{
            metricName: 'hit_rate_percent',
            predictedValue: this.predictCacheHitRate(
              currentMetrics.requestCount,
              currentMetrics.uniqueItems,
              model
            ),
            confidence: 0.88
          }]
        };
      case 'queue':
        return {
          ...basePrediction,
          predictions: [{
            metricName: 'avg_queue_depth',
            predictedValue: this.predictQueueDepth(
              currentMetrics.arrivalRate,
              model.parameters.serviceRate
            ),
            confidence: 0.90
          }]
        };
      default:
        return basePrediction;
    }
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

