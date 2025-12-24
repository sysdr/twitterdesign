export class DataIngestionManager {
  constructor() {
    this.eventQueue = [];
    this.eventTypes = ['tweet', 'like', 'retweet', 'reply', 'follow'];
    this.batchSize = 100;
    this.simulateDataStream();
  }

  simulateDataStream() {
    setInterval(() => {
      // Generate realistic Twitter events
      const numEvents = Math.floor(Math.random() * 50) + 50;
      for (let i = 0; i < numEvents; i++) {
        this.eventQueue.push(this.generateEvent());
      }
    }, 100);
  }

  generateEvent() {
    const type = this.eventTypes[Math.floor(Math.random() * this.eventTypes.length)];
    const userId = Math.floor(Math.random() * 1000000);
    
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId,
      timestamp: Date.now(),
      data: {}
    };

    switch (type) {
      case 'tweet':
        event.data = {
          content: `Sample tweet content ${Math.random()}`,
          contentLength: Math.floor(Math.random() * 280),
          mediaCount: Math.floor(Math.random() * 4),
          hashtags: Math.floor(Math.random() * 5)
        };
        break;
      case 'like':
        event.data = {
          tweetId: `tweet_${Math.floor(Math.random() * 100000)}`,
          likeCount: Math.floor(Math.random() * 1000)
        };
        break;
      case 'retweet':
        event.data = {
          originalTweetId: `tweet_${Math.floor(Math.random() * 100000)}`,
          comment: Math.random() > 0.5 ? 'Quote tweet' : null
        };
        break;
    }

    // Occasionally introduce data quality issues for testing
    if (Math.random() < 0.02) {
      if (Math.random() < 0.5) {
        delete event.timestamp; // Missing required field
      } else {
        event.data.contentLength = -5; // Invalid range
      }
    }

    return event;
  }

  async fetchBatch(size = this.batchSize) {
    const batch = this.eventQueue.splice(0, Math.min(size, this.eventQueue.length));
    return batch;
  }

  async close() {
    this.eventQueue = [];
  }
}
