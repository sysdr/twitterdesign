export interface Tweet {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  content: string;
  mediaUrls?: string[];
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  isLiked?: boolean;
  isRetweeted?: boolean;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  followerCount: number;
  followingCount: number;
  bio?: string;
  avatarUrl?: string;
}

export type TimelineModel = 'pull' | 'push' | 'hybrid';

export interface TimelineResponse {
  tweets: Tweet[];
  nextCursor?: string;
  hasMore: boolean;
  generationTime: number;
  model: TimelineModel;
}

export interface PaginationCursor {
  timestamp: string;
  tweetId: string;
}
