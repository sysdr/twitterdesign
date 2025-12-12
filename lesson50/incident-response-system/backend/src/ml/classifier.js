import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';
import path from 'path';

class IncidentClassifier {
  constructor() {
    this.model = null;
    this.classes = [
      'database_connection_exhaustion',
      'service_crash',
      'high_error_rate',
      'cascading_failure',
      'memory_leak',
      'network_partition'
    ];
  }

  async initialize() {
    try {
      // Try to load existing model
      const modelPath = path.join(process.cwd(), 'data/models/incident-classifier');
      this.model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
      console.log('✓ Loaded pre-trained ML classifier');
    } catch (error) {
      // Create and train new model
      console.log('Creating new ML classifier...');
      await this.createAndTrainModel();
    }
  }

  async createAndTrainModel() {
    // Define model architecture
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [7], units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: this.classes.length, activation: 'softmax' })
      ]
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    // Generate synthetic training data
    const { features, labels } = this.generateTrainingData(1000);
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);

    await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    });

    // Save model
    const modelPath = path.join(process.cwd(), 'data/models/incident-classifier');
    await fs.mkdir(modelPath, { recursive: true });
    await this.model.save(`file://${modelPath}`);

    xs.dispose();
    ys.dispose();

    console.log('✓ ML classifier trained and saved');
  }

  generateTrainingData(samples) {
    const features = [];
    const labels = [];

    for (let i = 0; i < samples; i++) {
      const classIdx = Math.floor(Math.random() * this.classes.length);
      const feature = this.generateFeatureForClass(classIdx);
      const label = Array(this.classes.length).fill(0);
      label[classIdx] = 1;

      features.push(feature);
      labels.push(label);
    }

    return { features, labels };
  }

  generateFeatureForClass(classIdx) {
    // Generate realistic features for each incident type
    const baseFeatures = {
      0: [0.15, 800, 0.85, 0.4, 0, 14, 1],    // DB connection exhaustion
      1: [0.25, 1200, 0.95, 0.2, 1, 10, 0],   // Service crash
      2: [0.20, 600, 0.3, 0.5, 0, 15, 0],     // High error rate
      3: [0.18, 1000, 0.6, 0.7, 0, 12, 1],    // Cascading failure
      4: [0.10, 900, 0.9, 0.8, 0, 16, 0],     // Memory leak
      5: [0.30, 2000, 0.4, 0.3, 1, 11, 0]     // Network partition
    };

    return baseFeatures[classIdx].map(v => v + (Math.random() - 0.5) * 0.1);
  }

  extractFeatures(incident) {
    const metrics = incident.metrics || {};
    return [
      metrics.error_rate || 0,
      metrics.p99_latency || 500,
      metrics.cpu_usage || 0.5,
      metrics.memory_usage || 0.5,
      this.wasRecentDeploy(incident.service) ? 1 : 0,
      new Date().getHours(),
      this.isHighTrafficService(incident.service) ? 1 : 0
    ];
  }

  wasRecentDeploy(service) {
    // Simulate recent deploy check (would check real deployment records)
    return Math.random() > 0.8;
  }

  isHighTrafficService(service) {
    return ['tweet-service', 'timeline-service'].includes(service);
  }

  async predict(incident) {
    const features = this.extractFeatures(incident);
    const tensor = tf.tensor2d([features]);
    const prediction = this.model.predict(tensor);
    const probabilities = await prediction.data();
    
    const maxProb = Math.max(...probabilities);
    const predictedIdx = probabilities.indexOf(maxProb);

    tensor.dispose();
    prediction.dispose();

    return {
      type: this.classes[predictedIdx],
      confidence: maxProb,
      probabilities: Object.fromEntries(
        this.classes.map((cls, i) => [cls, probabilities[i]])
      )
    };
  }
}

export const classifier = new IncidentClassifier();
