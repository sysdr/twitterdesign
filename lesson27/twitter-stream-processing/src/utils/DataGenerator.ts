import { Kafka, Producer } from 'kafkajs';
import { kafkaConfig, topics } from '../config/kafka';
import { TweetEvent, EngagementEvent, FollowEvent } from '../models/types';

export class DataGenerator {
  private kafka: Kafka;
  private producer: Producer;
  private isRunning: boolean = false;

  private hashtags = ['#tech', '#ai', '#startup', '#coding', '#webdev', '#cloud', 
                     '#ml', '#devops', '#programming', '#javascript', '#python'];
  private userIds: string[];

  constructor() {
    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer();
    this.userIds = Array.from({ length: 10000 }, (_, i) => `user-${i}`);
  }

  async start(): Promise<void> {
    await this.producer.connect();
    this.isRunning = true;
    
    console.log('✓ Data generator started - producing 1000 events/sec');
    
    // Generate tweets
    this.generateTweets();
    
    // Generate engagements
    this.generateEngagements();
    
    // Generate follows
    this.generateFollows();
  }

  private generateTweets(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      const batch = Array.from({ length: 100 }, () => {
        const hashtags = this.getRandomHashtags();
        const tweet: TweetEvent = {
          id: `tweet-${Date.now()}-${Math.random()}`,
          userId: this.getRandomUser(),
          text: `Sample tweet with ${hashtags.join(' ')}`,
          hashtags,
          timestamp: Date.now()
        };
        
        return {
          topic: topics.tweets,
          messages: [{
            key: tweet.id,
            value: JSON.stringify(tweet)
          }]
        };
      });

      await this.producer.sendBatch({ topicMessages: batch });
    }, 100); // 1000 events/sec
  }

  private generateEngagements(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      const batch = Array.from({ length: 300 }, () => {
        const types: Array<'like' | 'retweet' | 'reply'> = ['like', 'retweet', 'reply'];
        const event: EngagementEvent = {
          type: types[Math.floor(Math.random() * types.length)],
          tweetId: `tweet-${Math.floor(Math.random() * 1000)}`,
          userId: this.getRandomUser(),
          timestamp: Date.now()
        };
        
        return {
          topic: topics.engagements,
          messages: [{
            key: event.userId,
            value: JSON.stringify(event)
          }]
        };
      });

      await this.producer.sendBatch({ topicMessages: batch });
    }, 100); // 3000 events/sec
  }

  private generateFollows(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      const batch = Array.from({ length: 50 }, () => {
        const event: FollowEvent = {
          followerId: this.getRandomUser(),
          followeeId: this.getRandomUser(),
          timestamp: Date.now()
        };
        
        return {
          topic: topics.follows,
          messages: [{
            key: event.followerId,
            value: JSON.stringify(event)
          }]
        };
      });

      await this.producer.sendBatch({ topicMessages: batch });
    }, 100); // 500 events/sec
  }

  private getRandomHashtags(): string[] {
    const count = Math.floor(Math.random() * 3) + 1;
    const selected: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const tag = this.hashtags[Math.floor(Math.random() * this.hashtags.length)];
      if (!selected.includes(tag)) {
        selected.push(tag);
      }
    }
    
    return selected;
  }

  private getRandomUser(): string {
    return this.userIds[Math.floor(Math.random() * this.userIds.length)];
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    await this.producer.disconnect();
  }
}
