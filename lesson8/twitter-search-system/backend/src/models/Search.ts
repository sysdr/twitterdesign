export interface SearchResult {
  id: string;
  type: 'tweet' | 'user';
  content: string;
  author?: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: Date;
  rank: number;
  highlights?: string[];
}

export interface TrendingTopic {
  hashtag: string;
  count: number;
  change: number;
  rank: number;
  updatedAt: Date;
}

export interface UserRecommendation {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  followersCount: number;
  mutualConnections: number;
  reason: string;
}
