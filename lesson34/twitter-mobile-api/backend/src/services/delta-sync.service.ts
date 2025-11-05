import { DatabaseService } from './database.service';
import { DeltaResponse, Tweet } from '../../../shared/types';

export class DeltaSyncService {
  constructor(private db: DatabaseService) {}
  
  async getTimelineDelta(
    lastSyncTime: number = 0,
    limit: number = 20
  ): Promise<DeltaResponse<Tweet>> {
    // Get tweets added or modified since last sync
    const modifiedTweets = this.db.getTweetsSince(lastSyncTime, limit);
    
    // Separate into added and modified
    const added = modifiedTweets.filter(t => t.createdAt > lastSyncTime);
    const modified = modifiedTweets.filter(t => 
      t.createdAt <= lastSyncTime && t.updatedAt > lastSyncTime
    );
    
    // Get deleted tweets
    const deleted = this.db.getDeletedTweetsSince(lastSyncTime);
    
    const syncTime = Date.now();
    const hasMore = modifiedTweets.length === limit;
    
    return {
      added,
      modified,
      deleted,
      syncTime,
      hasMore
    };
  }
  
  calculateDataSavings(fullResponse: any, deltaResponse: DeltaResponse<any>): number {
    const fullSize = JSON.stringify(fullResponse).length;
    const deltaSize = JSON.stringify(deltaResponse).length;
    
    return Math.round((1 - deltaSize / fullSize) * 100);
  }
}
