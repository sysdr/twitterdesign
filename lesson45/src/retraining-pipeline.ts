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
