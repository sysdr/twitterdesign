const { FeatureStore } = require('../../backend/dist/services/FeatureStore');
const { DataLakeService } = require('../../backend/dist/services/DataLakeService');

describe('Analytics Pipeline Tests', () => {
  let featureStore, dataLake;

  beforeEach(() => {
    featureStore = new FeatureStore();
    dataLake = new DataLakeService();
  });

  test('should calculate real-time metrics', async () => {
    const metrics = await featureStore.calculateRealTimeMetrics();
    expect(metrics).toHaveProperty('tweetsPerMinute');
    expect(metrics).toHaveProperty('activeUsers');
    expect(metrics).toHaveProperty('engagementRate');
    expect(metrics).toHaveProperty('viralContent');
  });

  test('should store and retrieve engagement data', async () => {
    const data = await dataLake.getEngagementData('24h');
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('should detect trending topics', async () => {
    const topics = await featureStore.getTrendingTopics();
    expect(Array.isArray(topics)).toBe(true);
    topics.forEach(topic => {
      expect(topic).toHaveProperty('topic');
      expect(topic).toHaveProperty('mentions');
      expect(topic).toHaveProperty('trend');
    });
  });
});
