export interface Tweet {
  id: string;
  userId: string;
  content: string;
  mediaUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  retweets: number;
  replies: number;
  username?: string;
  displayName?: string;
  isLiked?: boolean;
  isRetweeted?: boolean;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  followerCount: number;
  followingCount: number;
  bio?: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface Timeline {
  userId: string;
  tweetId: string;
  createdAt: Date;
  rank: number;
}
