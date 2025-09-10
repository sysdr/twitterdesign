export interface Tweet {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  likesCount: number;
  retweetsCount: number;
}

export interface TimelineEntry extends Tweet {
  shardId: number;
  retrievedAt: string;
}

export interface ShardStatus {
  shardId: number;
  status: 'healthy' | 'unhealthy';
  tweetCount: number;
  totalConnections: number;
  idleConnections: number;
  error?: string;
}

export interface PerformanceMetrics {
  totalQueries: number;
  avgLatency: number;
  cacheHits: number;
  shardFailures: number;
  shardStatus: ShardStatus[];
  cacheStats: {
    hits: number;
    misses: number;
    sets: number;
    hitRate: string;
  };
}
