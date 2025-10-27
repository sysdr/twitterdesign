export interface Tweet {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    verified: boolean;
    followerCount: number;
  };
  hashtags: string[];
  mentions: string[];
  mediaType?: 'image' | 'video' | 'gif';
  location?: {
    lat: number;
    lon: number;
  };
  timestamp: string;
  engagementScore: number;
  retweets: number;
  likes: number;
  replies: number;
  isVerified: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
  language: string;
}

export interface SearchResult {
  tweets: Tweet[];
  total: number;
  took: number;
  suggestions?: string[];
  facets?: {
    hashtags: Array<{ key: string; count: number }>;
    mentions: Array<{ key: string; count: number }>;
    mediaTypes: Array<{ key: string; count: number }>;
  };
}




