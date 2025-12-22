import { v4 as uuidv4 } from 'uuid';
import { ResourceUsage } from '../../models/CostModels';
import { logger } from '../../utils/logger';

export class MeteringService {
  private interval: NodeJS.Timeout | null = null;
  private services: Map<string, any> = new Map();
  private usageData: ResourceUsage[] = [];
  private isRunning = false;

  constructor() {
    this.initializeServices();
  }

  private initializeServices(): void {
    // Simulate multiple services with different resource patterns
    this.services.set('api-gateway', {
      cpuBase: 100,
      memoryBase: 512,
      variability: 0.3
    });
    this.services.set('tweet-service', {
      cpuBase: 200,
      memoryBase: 1024,
      variability: 0.5
    });
    this.services.set('timeline-service', {
      cpuBase: 300,
      memoryBase: 2048,
      variability: 0.4
    });
    this.services.set('media-storage', {
      storageBase: 1000,
      variability: 0.1
    });
    this.services.set('database-primary', {
      cpuBase: 400,
      memoryBase: 4096,
      queriesBase: 1000,
      variability: 0.6
    });
    this.services.set('cache-redis', {
      memoryBase: 8192,
      operationsBase: 5000,
      variability: 0.3
    });
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    const intervalMs = parseInt(process.env.COST_CALCULATION_INTERVAL || '10000');
    
    this.interval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    logger.info('MeteringService started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('MeteringService stopped');
  }

  private collectMetrics(): void {
    const timestamp = new Date();
    
    this.services.forEach((config, serviceId) => {
      const usage: ResourceUsage = {
        id: uuidv4(),
        serviceId,
        resourceType: this.getResourceType(serviceId),
        timestamp,
        metrics: this.generateMetrics(config)
      };

      this.usageData.push(usage);
      
      // Keep only last 1 hour of data
      const oneHourAgo = new Date(Date.now() - 3600000);
      this.usageData = this.usageData.filter(u => u.timestamp > oneHourAgo);
    });

    logger.debug(`Collected metrics for ${this.services.size} services`);
  }

  private getResourceType(serviceId: string): ResourceUsage['resourceType'] {
    if (serviceId.includes('database')) return 'database';
    if (serviceId.includes('storage')) return 'storage';
    if (serviceId.includes('cache')) return 'cache';
    if (serviceId.includes('cdn')) return 'network';
    return 'compute';
  }

  private generateMetrics(config: any): ResourceUsage['metrics'] {
    const variance = () => 1 + (Math.random() - 0.5) * config.variability;
    
    const metrics: ResourceUsage['metrics'] = {};

    if (config.cpuBase) {
      metrics.cpuMilliseconds = Math.floor(config.cpuBase * variance() * 1000);
    }
    if (config.memoryBase) {
      metrics.memoryMBSeconds = Math.floor(config.memoryBase * variance() * 10);
    }
    if (config.storageBase) {
      metrics.storageGBHours = config.storageBase * variance() / 60;
    }
    if (config.queriesBase) {
      metrics.databaseQueries = Math.floor(config.queriesBase * variance());
    }
    if (config.operationsBase) {
      metrics.cacheOperations = Math.floor(config.operationsBase * variance());
    }

    // Add some network usage for all services
    metrics.networkGB = Math.random() * 5;

    return metrics;
  }

  getRecentUsage(minutes: number = 10): ResourceUsage[] {
    const cutoff = new Date(Date.now() - minutes * 60000);
    return this.usageData.filter(u => u.timestamp > cutoff);
  }

  isHealthy(): boolean {
    return this.isRunning && this.usageData.length > 0;
  }
}
