import { DeltaResponse, Tweet } from '../../../shared/types';
import { OfflineStorageService } from './offline-storage.service';

export class DeltaSyncService {
  constructor(
    private storage: OfflineStorageService,
    private apiUrl: string
  ) {}
  
  async syncTimeline(): Promise<{ tweets: Tweet[], dataSaved: number }> {
    const syncState = await this.storage.getSyncState();
    const lastSyncTime = syncState?.lastSyncTime || 0;
    
    // Get full timeline for comparison
    const fullResponse = await fetch(`${this.apiUrl}/timeline/full?limit=50`);
    const fullData = await fullResponse.json();
    const fullSize = JSON.stringify(fullData).length;
    
    // Get delta
    const deltaResponse = await fetch(
      `${this.apiUrl}/timeline/delta?lastSyncTime=${lastSyncTime}&limit=50`
    );
    const delta: DeltaResponse<Tweet> = await deltaResponse.json();
    const deltaSize = JSON.stringify(delta).length;
    
    // Calculate data savings
    const dataSaved = Math.round((1 - deltaSize / fullSize) * 100);
    
    // Apply delta to local storage
    await this.applyDelta(delta);
    
    // Update sync state
    await this.storage.setSyncState({
      lastSyncTime: delta.syncTime,
      version: '1.0'
    });
    
    // Get updated timeline
    const tweets = await this.storage.getTweets(50);
    
    return { tweets, dataSaved };
  }
  
  private async applyDelta(delta: DeltaResponse<Tweet>): Promise<void> {
    // Save added and modified tweets
    await this.storage.saveTweets([...delta.added, ...delta.modified]);
    
    // Delete removed tweets
    await Promise.all(delta.deleted.map(id => this.storage.deleteTweet(id)));
  }
}
