import { Server } from '../../types';
import axios from 'axios';

export class HealthChecker {
  private healthStatus: Map<string, { failures: number; lastCheck: Date }> = new Map();
  private readonly failureThreshold = 3;
  private readonly checkInterval = 10000; // 10 seconds
  private intervalId?: NodeJS.Timeout;

  constructor(private servers: Server[], private onStatusChange: (server: Server) => void) {
    this.startHealthChecks();
  }

  private startHealthChecks(): void {
    this.intervalId = setInterval(() => {
      this.servers.forEach(server => this.checkServerHealth(server));
    }, this.checkInterval);
  }

  private async checkServerHealth(server: Server): Promise<void> {
    try {
      const startTime = Date.now();
      const response = await axios.get(`http://${server.host}:${server.port}/health`, {
        timeout: 5000
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        this.handleHealthyResponse(server, responseTime);
      } else {
        this.handleUnhealthyResponse(server);
      }
    } catch (error) {
      this.handleUnhealthyResponse(server);
    }
  }

  private handleHealthyResponse(server: Server, responseTime: number): void {
    const status = this.healthStatus.get(server.id);
    
    if (status) {
      status.failures = 0;
      status.lastCheck = new Date();
    } else {
      this.healthStatus.set(server.id, { failures: 0, lastCheck: new Date() });
    }

    const newStatus = responseTime > 1000 ? 'warning' : 
                     server.status === 'recovering' ? 'recovering' : 'healthy';
    
    if (server.status !== newStatus) {
      server.status = newStatus;
      server.responseTime = responseTime;
      server.lastHealthCheck = new Date();
      this.onStatusChange(server);
    }
  }

  private handleUnhealthyResponse(server: Server): void {
    const status = this.healthStatus.get(server.id) || { failures: 0, lastCheck: new Date() };
    status.failures++;
    status.lastCheck = new Date();
    this.healthStatus.set(server.id, status);

    if (status.failures >= this.failureThreshold && server.status !== 'unhealthy') {
      server.status = 'unhealthy';
      server.lastHealthCheck = new Date();
      this.onStatusChange(server);
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
