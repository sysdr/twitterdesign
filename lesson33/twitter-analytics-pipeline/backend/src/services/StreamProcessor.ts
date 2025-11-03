import { Server } from 'socket.io';
import { FeatureStore } from './FeatureStore';
import { DataLakeService } from './DataLakeService';

interface TweetEvent {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
  type: 'tweet' | 'like' | 'retweet' | 'reply';
}

export class StreamProcessor {
  private isRunning = false;

  constructor(
    private io: Server,
    private featureStore: FeatureStore,
    private dataLake: DataLakeService
  ) {}

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔥 Starting stream processor...');

    // Simulate real-time event processing
    this.processRealTimeEvents();
    this.calculateMetrics();
    this.detectTrendingTopics();
  }

  private processRealTimeEvents() {
    setInterval(() => {
      // Simulate incoming tweet events
      const events: TweetEvent[] = this.generateMockEvents();
      
      events.forEach(event => {
        this.processEvent(event);
      });
    }, 1000);
  }

  private generateMockEvents(): TweetEvent[] {
    const eventTypes = ['tweet', 'like', 'retweet', 'reply'] as const;
    const events: TweetEvent[] = [];
    
    // Generate 10-50 events per second to simulate real traffic
    const eventCount = Math.floor(Math.random() * 40) + 10;
    
    for (let i = 0; i < eventCount; i++) {
      events.push({
        id: `event_${Date.now()}_${i}`,
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        content: this.generateMockContent(),
        timestamp: Date.now(),
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)]
      });
    }
    
    return events;
  }

  private generateMockContent(): string {
    const topics = ['AI', 'blockchain', 'climate', 'sports', 'music', 'tech', 'politics'];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    return `Mock content about ${topic} #${topic}`;
  }

  private async processEvent(event: TweetEvent) {
    // Store raw event in data lake
    await this.dataLake.storeRawEvent(event);
    
    // Update feature store
    await this.featureStore.updateFeatures(event);
    
    // Detect viral content
    if (event.type === 'tweet' && this.isViralContent(event)) {
      await this.featureStore.markAsViral(event.id);
    }
  }

  private isViralContent(event: TweetEvent): boolean {
    // Simple viral detection logic
    return Math.random() > 0.95; // 5% chance to simulate viral content
  }

  private calculateMetrics() {
    setInterval(async () => {
      const metrics = await this.featureStore.calculateRealTimeMetrics();
      this.io.emit('realTimeMetrics', metrics);
      
      const engagement = await this.featureStore.getLatestEngagement();
      this.io.emit('engagementUpdate', engagement);
    }, 5000);
  }

  private detectTrendingTopics() {
    setInterval(async () => {
      const trending = await this.featureStore.detectTrendingTopics();
      this.io.emit('trendingUpdate', trending);
    }, 10000);
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 Stream processor stopped');
  }
}
