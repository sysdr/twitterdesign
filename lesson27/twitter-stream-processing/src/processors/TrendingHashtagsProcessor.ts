import { StreamProcessor } from './StreamProcessor';
import { TweetEvent, HashtagCount } from '../models/types';
import { topics } from '../config/kafka';

export class TrendingHashtagsProcessor extends StreamProcessor<TweetEvent, HashtagCount> {
  private readonly windowSize = 60000; // 1 minute
  private readonly slideInterval = 30000; // 30 seconds
  private readonly threshold = 100; // Min mentions to trend

  constructor() {
    super(topics.tweets, topics.trendingHashtags, 'trending-hashtags-processor');
  }

  protected async process(tweet: TweetEvent): Promise<HashtagCount[]> {
    const results: HashtagCount[] = [];
    const currentTime = Date.now();

    // Extract and count hashtags
    for (const hashtag of tweet.hashtags) {
      // Get all active windows for this timestamp
      const windows = this.getActiveWindows(currentTime);
      
      for (const window of windows) {
        const key = `${hashtag}:${window.start}`;
        const count = (this.state.get(key) || 0) + 1;
        this.state.set(key, count);

        // Check if exceeds threshold
        if (count >= this.threshold) {
          results.push({
            hashtag,
            count,
            windowStart: window.start,
            windowEnd: window.end
          });
        }
      }
    }

    // Clean old windows
    this.cleanOldWindows(currentTime);

    return results;
  }

  private getActiveWindows(timestamp: number): Array<{start: number, end: number}> {
    const windows: Array<{start: number, end: number}> = [];
    
    // Sliding windows that overlap
    for (let i = 0; i < Math.ceil(this.windowSize / this.slideInterval); i++) {
      const offset = i * this.slideInterval;
      const windowStart = Math.floor((timestamp - offset) / this.slideInterval) * this.slideInterval;
      const windowEnd = windowStart + this.windowSize;
      
      if (timestamp >= windowStart && timestamp < windowEnd) {
        windows.push({ start: windowStart, end: windowEnd });
      }
    }
    
    return windows;
  }

  private cleanOldWindows(currentTime: number): void {
    const cutoff = currentTime - this.windowSize * 2;
    
    for (const [key, _] of this.state.entries()) {
      const windowStart = parseInt(key.split(':')[1]);
      if (windowStart < cutoff) {
        this.state.delete(key);
      }
    }
  }

  protected getOutputKey(output: HashtagCount): string {
    return output.hashtag;
  }
}
