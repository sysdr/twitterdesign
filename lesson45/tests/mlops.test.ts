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
