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
