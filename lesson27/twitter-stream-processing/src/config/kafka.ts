export const kafkaConfig = {
  clientId: 'twitter-stream-processor',
  brokers: ['localhost:9092'],
  connectionTimeout: 10000,
  retry: {
    retries: 10,
    initialRetryTime: 300
  }
};

export const processorConfig = {
  groupId: 'stream-processor-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  maxPollRecords: 1000,
  autoCommit: false, // Manual commit for exactly-once
};

export const topics = {
  tweets: 'tweets',
  engagements: 'engagements',
  follows: 'follows',
  trendingHashtags: 'trending-hashtags',
  userActivityScores: 'user-activity-scores',
  engagementMetrics: 'engagement-metrics'
};
