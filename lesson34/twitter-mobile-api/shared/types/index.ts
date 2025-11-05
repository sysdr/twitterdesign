// Shared types between frontend and backend

export interface Tweet {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: number;
  updatedAt: number;
  likesCount: number;
  retweetsCount: number;
  repliesCount: number;
  mediaUrls?: string[];
  status?: 'pending' | 'synced' | 'failed';
}

export interface DeltaResponse<T> {
  added: T[];
  modified: T[];
  deleted: string[];
  syncTime: number;
  hasMore: boolean;
  cursor?: string;
}

export interface SyncState {
  lastSyncTime: number;
  version: string;
}

export interface TimelineRequest {
  lastSyncTime?: number;
  cursor?: string;
  limit?: number;
  fields?: string[];
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

export interface OfflineAction {
  id: string;
  type: 'POST_TWEET' | 'LIKE_TWEET' | 'RETWEET' | 'DELETE_TWEET';
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface BatchRequest {
  operations: Array<{
    id: string;
    method: string;
    path: string;
    body?: any;
  }>;
}

export interface BatchResponse {
  results: Array<{
    id: string;
    status: number;
    data: any;
    error?: string;
  }>;
}
