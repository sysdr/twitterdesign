export interface DomainEvent {
  id: string;
  streamId: string;
  streamType: string;
  eventType: string;
  eventData: any;
  metadata: EventMetadata;
  version: number;
  createdAt: Date;
  correlationId?: string;
  causationId?: string;
}

export interface EventMetadata {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface Command {
  id: string;
  type: string;
  data: any;
  metadata: EventMetadata;
}

export interface Snapshot {
  id: string;
  streamId: string;
  streamType: string;
  version: number;
  data: any;
  createdAt: Date;
}

// Domain Events
export interface UserCreatedEvent extends DomainEvent {
  eventType: 'UserCreated';
  eventData: {
    userId: string;
    username: string;
    email: string;
    displayName?: string;
  };
}

export interface TweetCreatedEvent extends DomainEvent {
  eventType: 'TweetCreated';
  eventData: {
    tweetId: string;
    userId: string;
    content: string;
    mentions: string[];
    hashtags: string[];
  };
}

export interface UserFollowedEvent extends DomainEvent {
  eventType: 'UserFollowed';
  eventData: {
    followerId: string;
    followeeId: string;
  };
}

export interface TweetLikedEvent extends DomainEvent {
  eventType: 'TweetLiked';
  eventData: {
    tweetId: string;
    userId: string;
  };
}
