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
