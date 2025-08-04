export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface EngagementUpdate {
  tweetId: string;
  action: 'like' | 'unlike' | 'retweet' | 'unretweet';
  userId: string;
}
