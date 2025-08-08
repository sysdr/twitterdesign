export interface Tweet {
  id: string;
  content: string;
  authorId: string;
  authorUsername: string;
  createdAt: Date;
  likesCount: number;
  retweetsCount: number;
}

export interface Event {
  id: string;
  type: string;
  payload: any;
  userId: string;
  timestamp: Date;
  version: number;
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface Stats {
  totalUsers: number;
  totalTweets: number;
  totalEvents: number;
  onlineUsers: number;
  activeConnections: number;
  uptime: number;
}
