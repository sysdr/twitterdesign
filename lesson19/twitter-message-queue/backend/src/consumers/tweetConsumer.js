const { kafka } = require('../../config/kafka');
const redisClient = require('../../config/redis');

class TweetConsumer {
  constructor() {
    this.consumer = kafka.consumer({
      groupId: 'tweet-processor',
      sessionTimeout: 30000,
      rebalanceTimeout: 60000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576,
      minBytes: 1,
      maxBytes: 10485760,
      maxWaitTimeInMs: 5000,
    });
    
    this.timelineConsumer = kafka.consumer({
      groupId: 'timeline-processor',
      sessionTimeout: 30000,
      rebalanceTimeout: 60000,
    });
    
    this.isRunning = false;
    this.messageHandlers = [];
  }

  async start() {
    try {
      await this.consumer.connect();
      await this.timelineConsumer.connect();
      
      await this.consumer.subscribe({
        topics: ['tweets'],
        fromBeginning: false
      });
      
      await this.timelineConsumer.subscribe({
        topics: ['timeline-updates'],
        fromBeginning: false
      });
      
      this.isRunning = true;
      
      // Start consuming tweets
      this.consumer.run({
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
          await this.processTweetMessage(topic, partition, message, heartbeat);
        },
        eachBatchAutoResolve: true,
        autoCommitThreshold: 100,
      });
      
      // Start consuming timeline updates
      this.timelineConsumer.run({
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
          await this.processTimelineUpdate(topic, partition, message, heartbeat);
        },
      });
      
      console.log('✅ Tweet consumers started');
    } catch (error) {
      console.error('❌ Failed to start tweet consumer:', error);
      throw error;
    }
  }

  async stop() {
    if (this.isRunning) {
      await this.consumer.disconnect();
      await this.timelineConsumer.disconnect();
      this.isRunning = false;
      console.log('✅ Tweet consumers stopped');
    }
  }

  async processTweetMessage(topic, partition, message, heartbeat) {
    try {
      const tweet = JSON.parse(message.value.toString());
      
      // Add partition and offset info
      tweet.partition = partition;
      tweet.offset = message.offset;
      
      console.log('📥 Processing tweet:', {
        id: tweet.id,
        partition,
        offset: message.offset,
        timestamp: tweet.timestamp
      });
      
      // Cache the tweet in Redis
      await this.cacheTweet(tweet);
      
      // Call registered handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(tweet);
        } catch (error) {
          console.error('❌ Message handler error:', error);
        }
      });
      
      // Heartbeat to prevent rebalance
      await heartbeat();
      
    } catch (error) {
      console.error('❌ Failed to process tweet message:', error);
    }
  }

  async processTimelineUpdate(topic, partition, message, heartbeat) {
    try {
      const update = JSON.parse(message.value.toString());
      
      console.log('📥 Processing timeline update:', {
        tweetId: update.tweetId,
        action: update.action,
        partition,
        offset: message.offset
      });
      
      // Update timeline cache
      await this.updateTimelineCache(update);
      
      await heartbeat();
      
    } catch (error) {
      console.error('❌ Failed to process timeline update:', error);
    }
  }

  async cacheTweet(tweet) {
    try {
      // Cache individual tweet
      const tweetKey = `tweet:${tweet.id}`;
      await redisClient.setex(tweetKey, 3600, JSON.stringify(tweet));
      
      // Add to user's tweets list
      const userTweetsKey = `user:${tweet.userId}:tweets`;
      await redisClient.lpush(userTweetsKey, tweet.id);
      await redisClient.expire(userTweetsKey, 3600);
      
      console.log('💾 Tweet cached:', tweet.id);
    } catch (error) {
      console.error('❌ Failed to cache tweet:', error);
    }
  }

  async updateTimelineCache(update) {
    try {
      // This would typically update follower timelines
      // For demo, we'll just log the update
      const cacheKey = `timeline:global`;
      const timelineItem = {
        tweetId: update.tweetId,
        userId: update.userId,
        username: update.username,
        content: update.content,
        timestamp: update.timestamp
      };
      
      await redisClient.lpush(cacheKey, JSON.stringify(timelineItem));
      await redisClient.ltrim(cacheKey, 0, 999); // Keep latest 1000 items
      
      console.log('📱 Timeline updated for tweet:', update.tweetId);
    } catch (error) {
      console.error('❌ Failed to update timeline cache:', error);
    }
  }

  onTweetReceived(handler) {
    this.messageHandlers.push(handler);
  }

  // Get consumer lag for monitoring
  async getConsumerLag() {
    try {
      // This is a simplified version - in production you'd use Kafka admin client
      return {
        'tweet-processor': 0,
        'timeline-processor': 0
      };
    } catch (error) {
      console.error('❌ Failed to get consumer lag:', error);
      return {};
    }
  }
}

module.exports = TweetConsumer;
