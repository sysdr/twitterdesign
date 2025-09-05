export interface Server {
  id: string;
  host: string;
  port: number;
  region: string;
  status: 'healthy' | 'warning' | 'unhealthy' | 'recovering';
  load: number;
  responseTime: number;
  lastHealthCheck: Date;
}

export interface LoadBalancerConfig {
  maxLoad: number;
  healthCheckInterval: number;
  failureThreshold: number;
  recoveryThreshold: number;
}

export interface Request {
  id: string;
  clientIp: string;
  path: string;
  method: string;
  timestamp: Date;
  region?: string;
}

export interface HashRingNode {
  server: Server;
  hash: number;
  virtualNodes: number[];
}

export interface RoutingMetrics {
  totalRequests: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  serverDistribution: Record<string, number>;
}
