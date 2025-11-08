export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLoginAt?: Date;
  isBlocked: boolean;
  riskScore: number;
}

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  iat: number;
  exp: number;
}

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress: string;
  userAgent: string;
  isRevoked: boolean;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  refillRate: number;
}

export interface ThreatScore {
  userId: string;
  score: number;
  factors: {
    accountAge: number;
    activityPattern: number;
    deviceFingerprint: number;
    locationPattern: number;
    engagementRate: number;
  };
  timestamp: Date;
}

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'rate_limit_exceeded' | 'suspicious_activity' | 'blocked_action';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    lat: number;
    lon: number;
  };
  timestamp: Date;
  metadata?: Record<string, any>;
}
