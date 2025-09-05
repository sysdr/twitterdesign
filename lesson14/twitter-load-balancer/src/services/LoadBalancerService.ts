import { Server, Request, LoadBalancerConfig, RoutingMetrics } from '../types';
import { HashRing } from '../lib/consistent-hashing/HashRing';
import { HealthChecker } from '../lib/health-checker/HealthChecker';
import { GeoRouter } from '../lib/geo-router/GeoRouter';

export class LoadBalancerService {
  private hashRing: HashRing;
  private healthChecker: HealthChecker;
  private geoRouter: GeoRouter;
  private serverLoads: Map<string, number> = new Map();
  private requestCount = 0;
  private startTime = Date.now();
  private listeners: Map<string, Function[]> = new Map();

  constructor(
    private servers: Server[],
    private config: LoadBalancerConfig
  ) {
    this.hashRing = new HashRing(servers);
    this.geoRouter = new GeoRouter();
    this.healthChecker = new HealthChecker(servers, this.handleServerStatusChange.bind(this));
    
    // Initialize server loads
    servers.forEach(server => this.serverLoads.set(server.id, 0));
  }

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(...args));
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }

  routeRequest(request: Request): Server | null {
    // Determine client region
    const clientRegion = this.geoRouter.getClientRegion(request.clientIp);
    request.region = clientRegion;

    // Get optimal servers for the region
    const availableServers = this.geoRouter.selectOptimalServers(clientRegion, this.servers);
    
    if (availableServers.length === 0) {
      return null;
    }

    // Create a temporary hash ring with only optimal servers
    const tempHashRing = new HashRing(availableServers);
    
    // Use consistent hashing with bounded loads
    const routingKey = `${request.clientIp}:${request.path}`;
    const selectedServer = tempHashRing.getServerWithBounds(
      routingKey,
      this.serverLoads,
      this.config.maxLoad
    );

    if (selectedServer) {
      // Update server load
      const currentLoad = this.serverLoads.get(selectedServer.id) || 0;
      this.serverLoads.set(selectedServer.id, currentLoad + 1);
      this.requestCount++;
      
      this.emit('requestRouted', {
        request,
        server: selectedServer,
        region: clientRegion
      });
    }

    return selectedServer;
  }

  completeRequest(serverId: string): void {
    const currentLoad = this.serverLoads.get(serverId) || 0;
    this.serverLoads.set(serverId, Math.max(0, currentLoad - 1));
  }

  private handleServerStatusChange(server: Server): void {
    if (server.status === 'unhealthy') {
      this.hashRing.removeServer(server.id);
    } else if (server.status === 'healthy') {
      this.hashRing.addServer(server);
    }
    
    this.emit('serverStatusChanged', server);
  }

  getMetrics(): RoutingMetrics {
    const uptime = (Date.now() - this.startTime) / 1000;
    const requestsPerSecond = this.requestCount / uptime;
    
    const serverDistribution: Record<string, number> = {};
    this.servers.forEach(server => {
      serverDistribution[server.id] = this.serverLoads.get(server.id) || 0;
    });

    return {
      totalRequests: this.requestCount,
      requestsPerSecond: Math.round(requestsPerSecond),
      averageResponseTime: this.calculateAverageResponseTime(),
      errorRate: this.calculateErrorRate(),
      serverDistribution
    };
  }

  private calculateAverageResponseTime(): number {
    const healthyServers = this.servers.filter(s => s.status === 'healthy' || s.status === 'warning');
    if (healthyServers.length === 0) return 0;
    
    const totalResponseTime = healthyServers.reduce((sum, server) => sum + server.responseTime, 0);
    return Math.round(totalResponseTime / healthyServers.length);
  }

  private calculateErrorRate(): number {
    const unhealthyServers = this.servers.filter(s => s.status === 'unhealthy').length;
    return (unhealthyServers / this.servers.length) * 100;
  }

  stop(): void {
    this.healthChecker.stop();
  }
}
