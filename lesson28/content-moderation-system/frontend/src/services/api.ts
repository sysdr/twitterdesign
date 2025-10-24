import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ModerationStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  flagged: number;
}

export interface ModerationItem {
  id: string;
  post_id: string;
  username: string;
  content: string;
  created_at: string;
  violation_type?: string;
  confidence_score?: number;
  priority: number;
  status: string;
}

export interface ReviewSubmission {
  postId: string;
  decision: string;
  reason: string;
  moderatorId: string;
}

export interface Appeal {
  id: string;
  post_id: string;
  username: string;
  content: string;
  original_decision: string;
  reason: string;
  created_at: string;
  status: string;
}

export const moderationAPI = {
  getStats: async (): Promise<ModerationStats> => {
    const response = await api.get('/api/moderation/stats');
    return response.data;
  },

  getQueue: async (status: string): Promise<ModerationItem[]> => {
    const response = await api.get(`/api/moderation/queue?status=${status}`);
    return response.data;
  },

  submitReview: async (review: ReviewSubmission): Promise<void> => {
    await api.post(`/api/moderation/review/${review.postId}`, {
      decision: review.decision,
      reason: review.reason,
      moderatorId: review.moderatorId
    });
  },

  getAppeals: async (): Promise<Appeal[]> => {
    const response = await api.get('/api/moderation/appeals');
    return response.data;
  },

  processAppeal: async (appealId: string, decision: string, reason: string): Promise<void> => {
    await api.post(`/api/moderation/appeals/${appealId}/process`, {
      decision,
      reason,
      moderatorId: 'cc29e70e-d3f2-4a3d-b09f-836eb24a99f7' // Valid user ID
    });
  },

  getAnalytics: async (timeRange: string = '7d'): Promise<any> => {
    const response = await api.get(`/api/moderation/analytics?range=${timeRange}`);
    return response.data;
  },
};

export default api;
