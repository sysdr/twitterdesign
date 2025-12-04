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
