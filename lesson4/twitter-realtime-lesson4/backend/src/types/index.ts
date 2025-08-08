export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

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
  type: EventType;
  payload: any;
  userId: string;
  timestamp: Date;
  version: number;
}

export enum EventType {
  TWEET_CREATED = 'TWEET_CREATED',
  TWEET_LIKED = 'TWEET_LIKED',
  TWEET_RETWEETED = 'TWEET_RETWEETED',
  USER_FOLLOWED = 'USER_FOLLOWED',
  USER_ONLINE = 'USER_ONLINE',
  USER_OFFLINE = 'USER_OFFLINE'
}

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface ClientConnection {
  id: string;
  userId: string;
  ws: any;
  subscriptions: Set<string>;
  lastPing: Date;
}
