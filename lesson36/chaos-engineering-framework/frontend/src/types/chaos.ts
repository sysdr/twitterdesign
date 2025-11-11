export enum FailureType {
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_SLOW = 'DATABASE_SLOW',
  DATABASE_DOWN = 'DATABASE_DOWN',
  NETWORK_LATENCY = 'NETWORK_LATENCY',
  CACHE_FAILURE = 'CACHE_FAILURE',
  CPU_THROTTLE = 'CPU_THROTTLE',
  MEMORY_PRESSURE = 'MEMORY_PRESSURE'
}

export interface ExperimentTemplate {
  id: string;
  name: string;
  failureType: FailureType;
  target: string;
}

export interface ChaosExperiment {
  id: string;
  name: string;
  failureType: FailureType;
  target: string;
  intensity: number;
  duration: number;
  blastRadius: number;
  status: 'pending' | 'running' | 'completed' | 'aborted';
  startTime?: number;
  endTime?: number;
}

export interface ExperimentMetrics {
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  requestCount: number;
  failedRequests: number;
}

export interface SystemHealth {
  overall: number;
  services: Record<string, ServiceHealth>;
  timestamp: number;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  errorRate: number;
  latency: number;
  lastCheck: number;
}

export interface RealtimeData {
  metrics: ExperimentMetrics;
  health: SystemHealth;
  activeExperiments: ChaosExperiment[];
}
