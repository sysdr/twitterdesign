export interface Region {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
}

export interface Metric {
  id: string;
  regionId: string;
  timestamp: number;
  type: 'api_latency' | 'error_rate' | 'cpu_usage' | 'memory_usage' | 'db_connections' | 'cache_hit_rate';
  value: number;
  unit: string;
}

export interface Alert {
  id: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  regionId?: string;
  correlatedAlerts: string[];
  resolved: boolean;
  acknowledgedBy?: string;
}

export interface SystemState {
  globalStatus: 'healthy' | 'degraded' | 'incident';
  regions: Region[];
  activeAlerts: Alert[];
  metrics: Metric[];
}
