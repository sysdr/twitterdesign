export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
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
  timestamp: string;
}

export interface SecurityEvent {
  id: string;
  type: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    lat: number;
    lon: number;
  };
  timestamp: string;
}

export interface SecurityStats {
  login_attempt: number;
  failed_login: number;
  rate_limit_exceeded: number;
  suspicious_activity: number;
  blocked_action: number;
}
