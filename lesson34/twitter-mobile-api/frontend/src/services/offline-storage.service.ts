import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Tweet, OfflineAction, SyncState } from '../../../shared/types';

interface TwitterDB extends DBSchema {
  tweets: {
    key: string;
    value: Tweet;
    indexes: { 'by-timestamp': number };
  };
  syncQueue: {
    key: string;
    value: OfflineAction;
    indexes: { 'by-status': string };
  };
  metadata: {
    key: string;
    value: any;
  };
}

export class OfflineStorageService {
  private db: IDBPDatabase<TwitterDB> | null = null;
  
  async initialize(): Promise<void> {
    this.db = await openDB<TwitterDB>('twitter-mobile', 1, {
      upgrade(db) {
        // Tweets store
        if (!db.objectStoreNames.contains('tweets')) {
          const tweetStore = db.createObjectStore('tweets', { keyPath: 'id' });
          tweetStore.createIndex('by-timestamp', 'createdAt');
        }
        
        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          queueStore.createIndex('by-status', 'status');
        }
        
        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata');
        }
      }
    });
  }
  
  async saveTweet(tweet: Tweet): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('tweets', tweet);
  }
  
  async saveTweets(tweets: Tweet[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction('tweets', 'readwrite');
    await Promise.all(tweets.map(tweet => tx.store.put(tweet)));
    await tx.done;
  }
  
  async getTweets(limit: number = 50): Promise<Tweet[]> {
    if (!this.db) throw new Error('Database not initialized');
    const allTweets = await this.db.getAllFromIndex('tweets', 'by-timestamp');
    // Sort by timestamp descending (newest first) and limit
    return allTweets
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }
  
  async deleteTweet(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.delete('tweets', id);
  }
  
  async queueAction(action: OfflineAction): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('syncQueue', action);
  }
  
  async getPendingActions(): Promise<OfflineAction[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllFromIndex('syncQueue', 'by-status', 'pending');
  }
  
  async updateActionStatus(id: string, status: OfflineAction['status']): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const action = await this.db.get('syncQueue', id);
    if (action) {
      action.status = status;
      await this.db.put('syncQueue', action);
    }
  }
  
  async getSyncState(): Promise<SyncState | null> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.get('metadata', 'syncState');
  }
  
  async setSyncState(state: SyncState): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.put('metadata', state, 'syncState');
  }
  
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await Promise.all([
      this.db.clear('tweets'),
      this.db.clear('syncQueue'),
      this.db.clear('metadata')
    ]);
  }
}
