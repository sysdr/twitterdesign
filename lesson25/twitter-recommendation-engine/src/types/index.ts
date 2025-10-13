export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  followersCount: number;
  followingCount: number;
}

export interface Tweet {
  id: string;
  content: string;
  author: User;
  createdAt: Date;
  likesCount: number;
  retweetsCount: number;
  repliesCount: number;
  liked: boolean;
  retweeted: boolean;
  engagementScore?: number;
  recommendationScore?: number;
}

export interface UserInteraction {
  userId: string;
  tweetId: string;
  type: 'view' | 'like' | 'retweet' | 'reply' | 'click';
  timestamp: Date;
  dwellTime?: number;
}

export interface UserEmbedding {
  userId: string;
  vector: number[];
  lastUpdated: Date;
}

export interface RecommendationRequest {
  userId: string;
  limit: number;
  excludeIds?: string[];
  location?: string;
  deviceType?: string;
}

export interface RecommendationResponse {
  tweets: Tweet[];
  debugInfo?: {
    candidateCount: number;
    processingTime: number;
    algorithmVersion: string;
    sizeVariant?: string;
  };
}

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  trafficPercentage: number;
  variants: ExperimentVariant[];
}

export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, any>;
}

export interface ABTestResult {
  experimentId: string;
  variantId: string;
  userId: string;
  metrics: Record<string, number>;
}
