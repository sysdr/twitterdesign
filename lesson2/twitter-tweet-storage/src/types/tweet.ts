export interface Tweet {
  id: string;
  content: string;
  authorId: string;
  authorUsername: string;
  authorAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  mediaUrls: string[];
  engagement: TweetEngagement;
  parentTweetId?: string; // For replies
  isRetweet: boolean;
  originalTweetId?: string;
}

export interface TweetEngagement {
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  likedByCurrentUser: boolean;
  retweetedByCurrentUser: boolean;
}

export interface TweetVersion {
  id: string;
  tweetId: string;
  content: string;
  version: number;
  createdAt: Date;
  changes: string[];
}

export interface CreateTweetRequest {
  content: string;
  authorId: string;
  authorUsername: string;
  mediaFiles?: File[];
  parentTweetId?: string;
}

export interface UpdateTweetRequest {
  content: string;
  mediaFiles?: File[];
}

export interface TweetFilters {
  authorId?: string;
  hashtag?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasMedia?: boolean;
  limit?: number;
  offset?: number;
}
