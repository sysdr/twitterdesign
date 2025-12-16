import { SystemMetrics, ServerInstance } from '../models/types';

export class MetricsCollector {
  private metrics: SystemMetrics[] = [];
  private servers: Map<string, ServerInstance> = new Map();
  private collectionInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeServers();
  }

  private initializeServers(): void {
    // Initialize with 3 servers
    for (let i = 1; i <= 3; i++) {
      const server: ServerInstance = {
        id: `server-${i}`,
        status: 'running',
        region: 'us-east-1',
        capacity: 250, // requests per second
        cost: 0.10, // dollars per hour
        launchedAt: new Date()
      };
      this.servers.set(server.id, server);
    }
  }

  async collectMetrics(): Promise<SystemMetrics[]> {
    const currentMetrics: SystemMetrics[] = [];
    const timestamp = new Date();
    
    // Simulate realistic metrics for each server
    this.servers.forEach((server, serverId) => {
      if (server.status === 'running') {
        const baseLoad = this.calculateBaseLoad();
        const metrics: SystemMetrics = {
          timestamp,
          serverId,
          cpuUsage: this.generateRealisticCPU(baseLoad),
          memoryUsage: this.generateRealisticMemory(),
          requestRate: this.generateRequestRate(baseLoad, server.capacity),
          activeConnections: Math.floor(Math.random() * 1000) + 100,
          responseTime: this.calculateResponseTime(baseLoad)
        };
        currentMetrics.push(metrics);
        this.metrics.push(metrics);
      }
    });

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    return currentMetrics;
  }

  private calculateBaseLoad(): number {
    const hour = new Date().getHours();
    // Simulate daily traffic pattern
    if (hour >= 9 && hour <= 17) {
      return 0.7 + Math.random() * 0.2; // Peak hours: 70-90%
    } else if (hour >= 18 && hour <= 23) {
      return 0.5 + Math.random() * 0.2; // Evening: 50-70%
    } else {
      return 0.2 + Math.random() * 0.1; // Night: 20-30%
    }
  }

  private generateRealisticCPU(baseLoad: number): number {
    const noise = (Math.random() - 0.5) * 0.1;
    return Math.max(0, Math.min(100, (baseLoad * 100) + (noise * 100)));
  }

  private generateRealisticMemory(): number {
    return 40 + Math.random() * 30; // 40-70% memory usage
  }

  private generateRequestRate(baseLoad: number, capacity: number): number {
    return Math.floor(capacity * baseLoad);
  }

  private calculateResponseTime(load: number): number {
    // Response time increases with load
    const baseTime = 50;
    const loadFactor = Math.pow(load, 2) * 200;
    return baseTime + loadFactor;
  }

  getHistoricalMetrics(hours: number = 1): SystemMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  getCurrentServers(): ServerInstance[] {
    return Array.from(this.servers.values());
  }

  addServer(server: ServerInstance): void {
    this.servers.set(server.id, server);
  }

  removeServer(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.status = 'stopping';
      setTimeout(() => {
        this.servers.delete(serverId);
      }, 5000); // 5 second shutdown delay
    }
  }

  startCollection(intervalSeconds: number = 30): void {
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalSeconds * 1000);
  }

  stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }
}

export const metricsCollector = new MetricsCollector();
