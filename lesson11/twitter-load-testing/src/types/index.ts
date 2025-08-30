export interface User {
  id: string;
  username: string;
  email: string;
  created_at: Date;
  follower_count: number;
  following_count: number;
}

export interface Tweet {
  id: string;
  user_id: string;
  content: string;
  created_at: Date;
  like_count: number;
  retweet_count: number;
  reply_count: number;
}

export interface LoadTestMetrics {
  timestamp: number;
  concurrent_users: number;
  requests_per_second: number;
  avg_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  error_rate: number;
  cpu_usage: number;
  memory_usage: number;
  db_connections: number;
}

export interface PerformanceBottleneck {
  component: string;
  metric: string;
  current_value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

export interface UserBehaviorPattern {
  user_id: string;
  action_type: 'view_timeline' | 'like_tweet' | 'post_tweet' | 'follow_user';
  duration_ms: number;
  success: boolean;
  response_time_ms: number;
}
