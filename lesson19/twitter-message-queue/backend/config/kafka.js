const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'twitter-message-queue',
  brokers: ['localhost:9092', 'localhost:9093', 'localhost:9094'],
  logLevel: logLevel.INFO,
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const producer = kafka.producer({
  maxInFlightRequests: 1,
  idempotent: true,
  transactionTimeout: 30000,
});

const admin = kafka.admin();

// Topic configurations
const topics = [
  {
    topic: 'tweets',
    numPartitions: 12,
    replicationFactor: 3,
    configEntries: [
      { name: 'cleanup.policy', value: 'delete' },
      { name: 'retention.ms', value: '86400000' }, // 24 hours
      { name: 'segment.ms', value: '3600000' }, // 1 hour
    ]
  },
  {
    topic: 'timeline-updates',
    numPartitions: 12,
    replicationFactor: 3,
    configEntries: [
      { name: 'cleanup.policy', value: 'delete' },
      { name: 'retention.ms', value: '86400000' },
    ]
  },
  {
    topic: 'notifications',
    numPartitions: 6,
    replicationFactor: 3,
    configEntries: [
      { name: 'cleanup.policy', value: 'delete' },
      { name: 'retention.ms', value: '172800000' }, // 48 hours
    ]
  }
];

module.exports = {
  kafka,
  producer,
  admin,
  topics
};
