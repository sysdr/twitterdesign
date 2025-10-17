export interface User {
  id: string;
  username: string;
  followerCount: number;
  verified: boolean;
  engagementRate: number;
  tier: UserTier;
  influenceScore: number;
}

export enum UserTier {
  REGULAR = 'regular',
  POPULAR = 'popular',
  CELEBRITY = 'celebrity'
}

export interface Tweet {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  fanoutStrategy: FanoutStrategy;
  processedFollowers: number;
  totalFollowers: number;
  status: ProcessingStatus;
}

export enum FanoutStrategy {
  PUSH = 'push',
  PULL = 'pull',
  HYBRID = 'hybrid'
}

export enum ProcessingStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface SystemMetrics {
  queueDepth: number;
  averageResponseTime: number;
  throughput: number;
  errorRate: number;
  activeUsers: number;
}

export interface TokenBucket {
  tokens: number;
  capacity: number;
  refillRate: number;
  lastRefill: Date;
}
