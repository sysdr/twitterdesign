const TweetProducer = require('../../backend/src/producers/tweetProducer');
const TweetConsumer = require('../../backend/src/consumers/tweetConsumer');
const { v4: uuidv4 } = require('uuid');

describe('Kafka Integration Tests', () => {
  let producer;
  let consumer;

  beforeAll(async () => {
    producer = new TweetProducer();
    consumer = new TweetConsumer();
    
    await producer.start();
    await consumer.start();
  });

  afterAll(async () => {
    await producer.stop();
    await consumer.stop();
  });

  test('should publish and consume tweet messages', async (done) => {
    const testTweet = {
      id: uuidv4(),
      userId: 'test-user',
      username: 'testuser',
      content: 'Integration test tweet',
      timestamp: Date.now()
    };

    consumer.onTweetReceived((receivedTweet) => {
      if (receivedTweet.id === testTweet.id) {
        expect(receivedTweet.content).toBe(testTweet.content);
        expect(receivedTweet.username).toBe(testTweet.username);
        done();
      }
    });

    await producer.publishTweet(testTweet);
  }, 10000);

  test('should handle batch publishing', async () => {
    const batchSize = 100;
    const tweets = Array.from({ length: batchSize }, (_, i) => ({
      id: uuidv4(),
      userId: `user-${i}`,
      username: `user${i}`,
      content: `Batch tweet ${i}`,
      timestamp: Date.now() + i
    }));

    const result = await producer.publishBatch(tweets);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
