import consul from 'consul';
import axios from 'axios';

export class ServiceDiscovery {
  private consul = consul();
  private services: Map<string, any[]> = new Map();

  async registerService(name: string, port: number, health?: string): Promise<void> {
    try {
      await this.consul.agent.service.register({
        id: `${name}-${Date.now()}`,
        name,
        port,
        address: 'localhost',
        check: {
          http: health || `http://localhost:${port}/health`,
          interval: '10s'
        }
      });
      console.log(`✅ Service ${name} registered successfully`);
    } catch (error) {
      console.error(`❌ Failed to register service ${name}:`, error);
    }
  }

  async discoverService(serviceName: string): Promise<any[]> {
    try {
      const result = await this.consul.health.service({
        service: serviceName,
        passing: true
      }) as any[];
      
      this.services.set(serviceName, result);
      return result;
    } catch (error) {
      console.error(`❌ Service discovery failed for ${serviceName}:`, error);
      return this.services.get(serviceName) || [];
    }
  }

  async getHealthyInstance(serviceName: string): Promise<any | null> {
    const instances = await this.discoverService(serviceName);
    if (instances.length === 0) return null;
    
    // Simple round-robin selection
    const index = Math.floor(Math.random() * instances.length);
    return instances[index];
  }

  startHealthChecking(): void {
    setInterval(async () => {
      for (const serviceName of this.services.keys()) {
        await this.discoverService(serviceName);
      }
    }, 30000); // Check every 30 seconds
  }
}
