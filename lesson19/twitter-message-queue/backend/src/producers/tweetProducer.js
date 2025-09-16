const { producer } = require('../../config/kafka');
const crypto = require('crypto');

class TweetProducer {
  constructor() {
    this.producer = producer;
    this.isConnected = false;
  }

  async start() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('✅ Tweet producer connected');
    } catch (error) {
      console.error('❌ Failed to connect tweet producer:', error);
      throw error;
    }
  }

  async stop() {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('✅ Tweet producer disconnected');
    }
  }

  async publishTweet(tweet) {
    if (!this.isConnected) {
      throw new Error('Producer not connected');
    }

    try {
      // Use userId as partition key for consistent partitioning
      const partitionKey = tweet.userId;
      
      const message = {
        topic: 'tweets',
        messages: [{
          key: partitionKey,
          value: JSON.stringify(tweet),
          timestamp: tweet.timestamp.toString(),
          headers: {
            'content-type': 'application/json',
            'producer-id': 'tweet-producer',
            'correlation-id': tweet.id
          }
        }]
      };

      const result = await this.producer.send(message);
      
      console.log('📤 Tweet published:', {
        topic: result[0].topicName,
        partition: result[0].partition,
        offset: result[0].baseOffset,
        tweetId: tweet.id
      });

      // Trigger timeline updates
      await this.publishTimelineUpdate(tweet, result[0].partition, result[0].baseOffset);
      
      return result;
      
    } catch (error) {
      console.error('❌ Failed to publish tweet:', error);
      throw error;
    }
  }

  async publishTimelineUpdate(tweet, partition, offset) {
    try {
      const timelineUpdate = {
        tweetId: tweet.id,
        userId: tweet.userId,
        username: tweet.username,
        content: tweet.content,
        timestamp: tweet.timestamp,
        sourcePartition: partition,
        sourceOffset: offset,
        action: 'ADD_TWEET'
      };

      await this.producer.send({
        topic: 'timeline-updates',
        messages: [{
          key: tweet.userId,
          value: JSON.stringify(timelineUpdate),
          headers: {
            'content-type': 'application/json',
            'action': 'ADD_TWEET'
          }
        }]
      });

      console.log('📤 Timeline update published for tweet:', tweet.id);
    } catch (error) {
      console.error('❌ Failed to publish timeline update:', error);
    }
  }

  // Batch publish for load testing
  async publishBatch(tweets) {
    if (!this.isConnected) {
      throw new Error('Producer not connected');
    }

    try {
      const messages = tweets.map(tweet => ({
        key: tweet.userId,
        value: JSON.stringify(tweet),
        timestamp: tweet.timestamp.toString(),
        headers: {
          'content-type': 'application/json',
          'batch-id': crypto.randomUUID()
        }
      }));

      const result = await this.producer.send({
        topic: 'tweets',
        messages
      });

      console.log(`📤 Batch published: ${tweets.length} tweets`);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to publish batch:', error);
      throw error;
    }
  }
}

module.exports = TweetProducer;
