export interface VectorClock {
  [regionId: string]: number;
}

export interface ReplicationEvent {
  id: string;
  type: 'TWEET_CREATE' | 'TWEET_UPDATE' | 'USER_FOLLOW' | 'USER_UNFOLLOW';
  data: any;
  vectorClock: VectorClock;
  timestamp: number;
  originRegion: string;
  targetRegions: string[];
}

export interface ConflictResolution {
  eventId: string;
  conflictType: 'CONCURRENT_UPDATE' | 'CAUSAL_CONFLICT' | 'PARTITION_RECOVERY';
  strategy: 'LAST_WRITER_WINS' | 'MERGE' | 'MANUAL_RESOLVE';
  resolution: any;
  timestamp: number;
}

export interface Region {
  id: string;
  name: string;
  location: string;
  status: 'ACTIVE' | 'DEGRADED' | 'PARTITIONED' | 'OFFLINE';
  latency: number;
  lastSync: number;
  conflictRate: number;
}

export interface SyncMetrics {
  totalEvents: number;
  replicationLag: number;
  conflictsResolved: number;
  successRate: number;
  networkPartitions: number;
}

export interface Tweet {
  id: string;
  content: string;
  userId: string;
  timestamp: number;
  vectorClock: VectorClock;
  lastModified: number;
  regionOrigin: string;
}

export interface User {
  id: string;
  username: string;
  followers: string[];
  following: string[];
  vectorClock: VectorClock;
  lastModified: number;
  regionOrigin: string;
}
