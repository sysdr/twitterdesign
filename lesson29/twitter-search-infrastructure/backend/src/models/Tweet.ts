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
  timestamp: Date;
  engagementScore: number;
  retweets: number;
  likes: number;
  replies: number;
  isVerified: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
  language: string;
}

export interface SearchQuery {
  query: string;
  filters?: {
    hashtags?: string[];
    mentions?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    mediaType?: string;
    location?: {
      center: { lat: number; lon: number };
      radius: string;
    };
    verified?: boolean;
    language?: string;
  };
  sort?: 'relevance' | 'recent' | 'popular';
  userId?: string;
  page?: number;
  size?: number;
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
