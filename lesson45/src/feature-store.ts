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
