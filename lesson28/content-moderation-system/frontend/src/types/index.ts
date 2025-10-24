export interface User {
  id: string;
  username: string;
  email: string;
  role: 'moderator' | 'admin' | 'user';
  created_at: string;
  last_active: string;
}

export interface Post {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  violation_type?: string;
  confidence_score?: number;
  priority: number;
}

export interface ModerationReview {
  id: string;
  post_id: string;
  moderator_id: string;
  decision: 'approve' | 'reject';
  reason: string;
  created_at: string;
}

export interface Appeal {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  content: string;
  original_decision: string;
  appeal_reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at?: string;
  processed_by?: string;
}

export interface ModerationStats {
  approved: number;
  rejected: number;
  pending: number;
  flagged: number;
  total: number;
}

export interface AnalyticsData {
  totalReviews: number;
  activeModerators: number;
  avgResponseTime: number;
  flaggedContent: number;
  reviewsOverTime: Array<{
    date: string;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  violationTypes: Array<{
    name: string;
    value: number;
  }>;
  moderatorPerformance: Array<{
    moderator: string;
    reviews: number;
    accuracy: number;
  }>;
  detailedStats: Array<{
    metric: string;
    current: string | number;
    previous: string | number;
    change: number;
  }>;
}

export interface APIResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

