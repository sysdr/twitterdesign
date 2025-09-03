export interface Region {
  id: string;
  name: string;
  code: string;
  endpoint: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'healthy' | 'degraded' | 'failing' | 'recovering';
  latency: number;
  activeUsers: number;
  capacity: number;
  compliance: string[];
}

export interface LatencyData {
  from: string;
  to: string;
  latency: number;
  timestamp: number;
}

export interface TrafficRoute {
  userId: string;
  userLocation: {
    country: string;
    lat: number;
    lng: number;
  };
  assignedRegion: string;
  backupRegions: string[];
  reason: string;
}

export interface CDNCache {
  key: string;
  content: any;
  region: string;
  hitCount: number;
  expiresAt: number;
}

export interface ComplianceRule {
  region: string;
  dataTypes: string[];
  restrictions: string[];
  allowedCrossRegion: boolean;
}
