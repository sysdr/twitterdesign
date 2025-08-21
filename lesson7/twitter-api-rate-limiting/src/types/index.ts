import { Request } from 'express';

export interface User {
  id: string;
  username: string;
  email: string;
  verified: boolean;
  createdAt: Date;
  tier: 'basic' | 'premium' | 'verified';
}

export interface Tweet {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  likes: number;
  retweets: number;
  replies: number;
}

export interface RateLimitConfig {
  requests: number;
  window: number;
  burst: number;
  penalty: number;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  limit: number;
}

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    rateLimitInfo?: RateLimitInfo;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  rateLimitInfo?: RateLimitInfo;
}

export interface VersionedRequest extends Request {
  apiVersion: string;
  supportsFeature: (feature: string) => boolean;
}
