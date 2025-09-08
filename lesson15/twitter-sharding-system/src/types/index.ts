export interface User {
  id: string;
  username: string;
  email: string;
  followers: number;
  following: number;
  created_at: Date;
  shard_id: number;
}

export interface CreateUserInput {
  id: string;
  username: string;
  email: string;
  followers: number;
  following: number;
}

export interface Tweet {
  id: string;
  user_id: string;
  content: string;
  created_at: Date;
  likes: number;
  retweets: number;
  shard_id: number;
}

export interface CreateTweetInput {
  id: string;
  user_id: string;
  content: string;
  likes: number;
  retweets: number;
}

export interface ShardInfo {
  id: number;
  name: string;
  host: string;
  port: number;
  status: 'healthy' | 'degraded' | 'offline';
  load_percentage: number;
  user_count: number;
  tweet_count: number;
  last_health_check: Date;
}

export interface ShardStats {
  total_shards: number;
  healthy_shards: number;
  total_users: number;
  total_tweets: number;
  average_load: number;
  hot_shards: ShardInfo[];
}

export interface RebalanceOperation {
  id: string;
  source_shard: number;
  target_shard: number;
  user_ids: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  started_at?: Date;
  completed_at?: Date;
}
