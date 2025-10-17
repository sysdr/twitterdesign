import { StreamProcessor } from './StreamProcessor';
import { EngagementEvent, EngagementMetrics } from '../models/types';
import { topics } from '../config/kafka';

export class EngagementAnalyticsProcessor extends StreamProcessor<EngagementEvent, EngagementMetrics> {
  private readonly windowSize = 5000; // 5 seconds

  constructor() {
    super(topics.engagements, topics.engagementMetrics, 'engagement-analytics-processor');
  }

  protected async process(event: EngagementEvent): Promise<EngagementMetrics[]> {
    const windowKey = this.getWindowKey(event.timestamp, this.windowSize);
    const window = this.state.get(windowKey) || {
      likes: 0,
      retweets: 0,
      replies: 0,
      windowStart: parseInt(windowKey),
      windowEnd: parseInt(windowKey) + this.windowSize
    };

    // Increment appropriate counter
    switch (event.type) {
      case 'like':
        window.likes++;
        break;
      case 'retweet':
        window.retweets++;
        break;
      case 'reply':
        window.replies++;
        break;
    }

    this.state.set(windowKey, window);

    // Emit metrics for completed windows
    const currentWindow = this.getWindowKey(Date.now(), this.windowSize);
    if (windowKey !== currentWindow) {
      return [window];
    }

    return [];
  }

  protected getOutputKey(output: EngagementMetrics): string {
    return output.windowStart.toString();
  }
}
