import { Server, LoadBalancerConfig, RoutingDecision, LoadMetrics, ServerStatus } from '../../types';
import { WeightedHashRing } from '../hashing/hashRing';

export class BoundedLoadBalancer {
  private hashRing: WeightedHashRing;
  private config: LoadBalancerConfig;
  private requestCounts: Map<string, number> = new Map();
  private routingHistory: RoutingDecision[] = [];
  private spilloverCount: number = 0;

  constructor(config: LoadBalancerConfig) {
    this.config = config;
    this.hashRing = new WeightedHashRing(config.baseVirtualNodes);
  }

  addServer(server: Server): void {
    server.effectiveWeight = this.calculateEffectiveWeight(server);
    server.status = this.calculateStatus(server);
    this.hashRing.addServer(server);
    this.requestCounts.set(server.id, 0);
  }

  removeServer(serverId: string): void {
    this.hashRing.removeServer(serverId);
    this.requestCounts.delete(serverId);
  }

  route(requestId: string): RoutingDecision {
    const servers = this.hashRing.getServers();
    if (servers.length === 0) {
      throw new Error('No servers available');
    }

    // Calculate bounded load limit
    const totalRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0);
    const avgLoad = totalRequests / servers.length;
    const loadBound = Math.ceil((1 + this.config.epsilon) * avgLoad) + 1;

    // Get primary server from hash ring
    const primaryServerId = this.hashRing.getServer(requestId);
    if (!primaryServerId) {
      throw new Error('Hash ring returned no server');
    }

    // Check if primary server is within bounds
    const primaryServer = servers.find(s => s.id === primaryServerId);
    const primaryLoad = this.requestCounts.get(primaryServerId) || 0;
    let actualServerId = primaryServerId;
    let spillover = false;

    // Check both load bound and capacity limit
    const isOverBound = primaryLoad >= loadBound;
    const isOverCapacity = primaryServer && primaryLoad >= primaryServer.capacity;
    
    if (isOverBound || isOverCapacity) {
      // Spillover to next server
      const overloadedServers = new Set<string>();
      overloadedServers.add(primaryServerId);

      // Find next server within bounds
      for (const server of servers) {
        if (server.id === primaryServerId) continue;
        const load = this.requestCounts.get(server.id) || 0;
        if (load >= loadBound || load >= server.capacity) {
          overloadedServers.add(server.id);
        }
      }

      const nextServer = this.hashRing.getNextServer(requestId, overloadedServers);
      if (nextServer) {
        actualServerId = nextServer;
        spillover = true;
        this.spilloverCount++;
      }
    }

    // Update request count
    this.requestCounts.set(
      actualServerId, 
      (this.requestCounts.get(actualServerId) || 0) + 1
    );

    const decision: RoutingDecision = {
      requestId,
      hash: 0,
      primaryServer: primaryServerId,
      actualServer: actualServerId,
      spillover,
      timestamp: Date.now()
    };

    this.routingHistory.push(decision);
    if (this.routingHistory.length > 1000) {
      this.routingHistory.shift();
    }

    return decision;
  }

  updateServerMetrics(serverId: string, metrics: Partial<Server>): void {
    const servers = this.hashRing.getServers();
    const server = servers.find(s => s.id === serverId);
    
    if (server) {
      Object.assign(server, metrics);
      server.effectiveWeight = this.calculateEffectiveWeight(server);
      server.status = this.calculateStatus(server);
      this.hashRing.updateServerWeight(serverId, server.effectiveWeight);
    }
  }

  private calculateEffectiveWeight(server: Server): number {
    const { cpu, memory, responseTime } = this.config.healthWeights;
    
    // Health score based on current metrics
    const cpuScore = 1 - (server.cpu / 100);
    const memoryScore = 1 - (server.memory / 100);
    const responseScore = 1 / (1 + server.responseTime / 100);

    const healthScore = 
      cpu * cpuScore + 
      memory * memoryScore + 
      responseTime * responseScore;

    return server.weight * healthScore;
  }

  private calculateStatus(server: Server): ServerStatus {
    const loadRatio = server.currentLoad / server.capacity;
    
    if (loadRatio >= 1) return 'overloaded';
    if (loadRatio >= 0.9) return 'critical';
    if (loadRatio >= 0.7) return 'warning';
    return 'healthy';
  }

  getMetrics(): LoadMetrics {
    const loads = Array.from(this.requestCounts.values());
    if (loads.length === 0) {
      return {
        totalRequests: 0,
        spilloverCount: 0,
        loadVariance: 0,
        maxLoad: 0,
        minLoad: 0,
        avgLoad: 0
      };
    }

    const total = loads.reduce((a, b) => a + b, 0);
    const avg = total / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - avg, 2), 0) / loads.length;
    const stdDev = Math.sqrt(variance);

    return {
      totalRequests: total,
      spilloverCount: this.spilloverCount,
      loadVariance: avg > 0 ? (stdDev / avg) * 100 : 0,
      maxLoad: Math.max(...loads),
      minLoad: Math.min(...loads),
      avgLoad: avg
    };
  }

  getServers(): Server[] {
    const servers = this.hashRing.getServers();
    return servers.map(server => ({
      ...server,
      currentLoad: this.requestCounts.get(server.id) || 0
    }));
  }

  getRoutingHistory(): RoutingDecision[] {
    return [...this.routingHistory];
  }

  resetCounts(): void {
    for (const key of this.requestCounts.keys()) {
      this.requestCounts.set(key, 0);
    }
    this.spilloverCount = 0;
    this.routingHistory = [];
  }
}
