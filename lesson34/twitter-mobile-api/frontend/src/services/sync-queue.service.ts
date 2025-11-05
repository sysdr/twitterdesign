import { OfflineAction } from '../../../shared/types';
import { OfflineStorageService } from './offline-storage.service';

export class SyncQueueService {
  private processing = false;
  
  constructor(
    private storage: OfflineStorageService,
    private apiUrl: string
  ) {
    // Auto-sync when coming online
    window.addEventListener('online', () => this.processQueue());
  }
  
  async queueAction(action: Omit<OfflineAction, 'id' | 'retryCount' | 'status'>): Promise<void> {
    const fullAction: OfflineAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
      status: 'pending'
    };
    
    await this.storage.queueAction(fullAction);
    
    // Try to process if online
    if (navigator.onLine) {
      await this.processQueue();
    }
  }
  
  async processQueue(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    
    try {
      const actions = await this.storage.getPendingActions();
      
      for (const action of actions) {
        try {
          await this.executeAction(action);
          await this.storage.updateActionStatus(action.id, 'completed');
        } catch (error) {
          console.error('Failed to execute action:', error);
          
          if (action.retryCount < 3) {
            action.retryCount++;
            await this.storage.queueAction(action);
          } else {
            await this.storage.updateActionStatus(action.id, 'failed');
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }
  
  private async executeAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'POST_TWEET':
        await fetch(`${this.apiUrl}/tweets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        });
        break;
        
      case 'LIKE_TWEET':
        await fetch(`${this.apiUrl}/tweets/${action.data.tweetId}/like`, {
          method: 'POST'
        });
        break;
        
      case 'DELETE_TWEET':
        await fetch(`${this.apiUrl}/tweets/${action.data.tweetId}`, {
          method: 'DELETE'
        });
        break;
    }
  }
}
