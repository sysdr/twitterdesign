import { StreamProcessor } from './StreamProcessor';
import { TweetEvent, EngagementEvent, FollowEvent, UserActivityScore } from '../models/types';
import { topics } from '../config/kafka';

export class UserActivityProcessor extends StreamProcessor<any, UserActivityScore> {
  private readonly sessionWindow = 600000; // 10 minutes
  private readonly sessionGap = 60000; // 1 minute idle = new session

  constructor() {
    super(topics.tweets, topics.userActivityScores, 'user-activity-processor');
  }

  protected async process(event: any): Promise<UserActivityScore[]> {
    const userId = event.userId || event.followerId;
    const timestamp = event.timestamp;
    const results: UserActivityScore[] = [];

    // Get or create user session
    let session = this.state.get(userId);
    
    if (!session || (timestamp - session.lastActivity) > this.sessionGap) {
      // New session or gap exceeded - emit old session if exists
      if (session) {
        results.push(this.createScore(session));
      }
      
      // Start new session
      session = {
        userId,
        actions: 0,
        windowStart: timestamp,
        lastActivity: timestamp
      };
    }

    // Update session
    session.actions++;
    session.lastActivity = timestamp;
    this.state.set(userId, session);

    // Emit if session window exceeded
    if (timestamp - session.windowStart >= this.sessionWindow) {
      results.push(this.createScore(session));
      this.state.delete(userId);
    }

    return results;
  }

  private createScore(session: any): UserActivityScore {
    const duration = session.lastActivity - session.windowStart;
    const score = Math.min(100, Math.floor((session.actions / (duration / 1000)) * 10));
    
    return {
      userId: session.userId,
      score,
      actions: session.actions,
      windowStart: session.windowStart,
      windowEnd: session.lastActivity
    };
  }

  protected getOutputKey(output: UserActivityScore): string {
    return output.userId;
  }
}
