export enum FailureType {
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_SLOW = 'DATABASE_SLOW',
  DATABASE_DOWN = 'DATABASE_DOWN',
  NETWORK_LATENCY = 'NETWORK_LATENCY',
  NETWORK_PARTITION = 'NETWORK_PARTITION',
  CPU_THROTTLE = 'CPU_THROTTLE',
  MEMORY_PRESSURE = 'MEMORY_PRESSURE',
  DISK_FULL = 'DISK_FULL',
  CACHE_FAILURE = 'CACHE_FAILURE'
}

export interface ChaosExperiment {
  id: string;
  name: string;
  failureType: FailureType;
  target: string;
  intensity: number; // 0-100
  duration: number; // milliseconds
  blastRadius: number; // percentage of traffic affected
  status: 'pending' | 'running' | 'completed' | 'aborted';
  startTime?: number;
  endTime?: number;
  metrics?: ExperimentMetrics;
}

export interface ExperimentMetrics {
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  requestCount: number;
  failedRequests: number;
  recoveryTime?: number;
}

export interface SafetyThreshold {
  maxErrorRate: number; // 0.1 = 0.1%
  maxLatencyP99: number; // milliseconds
  maxRecoveryTime: number; // milliseconds
}

export interface SystemHealth {
  overall: number; // 0-100
  services: Map<string, ServiceHealth>;
  timestamp: number;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  errorRate: number;
  latency: number;
  lastCheck: number;
}
