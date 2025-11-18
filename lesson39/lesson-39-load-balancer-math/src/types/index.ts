export interface Server {
  id: string;
  name: string;
  capacity: number;
  currentLoad: number;
  cpu: number;
  memory: number;
  responseTime: number;
  virtualNodes: number;
  weight: number;
  effectiveWeight: number;
  status: ServerStatus;
}

export type ServerStatus = 'healthy' | 'warning' | 'critical' | 'overloaded';

export interface VirtualNode {
  hash: number;
  serverId: string;
  index: number;
}

export interface HashRing {
  nodes: VirtualNode[];
  serverMap: Map<string, Server>;
}

export interface LoadBalancerConfig {
  epsilon: number;
  baseVirtualNodes: number;
  healthWeights: {
    cpu: number;
    memory: number;
    responseTime: number;
  };
  updateInterval: number;
}

export interface RoutingDecision {
  requestId: string;
  hash: number;
  primaryServer: string;
  actualServer: string;
  spillover: boolean;
  timestamp: number;
}

export interface LoadMetrics {
  totalRequests: number;
  spilloverCount: number;
  loadVariance: number;
  maxLoad: number;
  minLoad: number;
  avgLoad: number;
}
