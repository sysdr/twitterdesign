export interface TweetEvent {
  id: string;
  userId: string;
  text: string;
  hashtags: string[];
  timestamp: number;
}

export interface EngagementEvent {
  type: 'like' | 'retweet' | 'reply';
  tweetId: string;
  userId: string;
  timestamp: number;
}

export interface FollowEvent {
  followerId: string;
  followeeId: string;
  timestamp: number;
}

export interface HashtagCount {
  hashtag: string;
  count: number;
  windowStart: number;
  windowEnd: number;
}

export interface UserActivityScore {
  userId: string;
  score: number;
  actions: number;
  windowStart: number;
  windowEnd: number;
}

export interface EngagementMetrics {
  likes: number;
  retweets: number;
  replies: number;
  windowStart: number;
  windowEnd: number;
}

export interface ProcessingStats {
  recordsProcessed: number;
  eventsPerSecond: number;
  latencyP99: number;
  activeWindows: number;
}
