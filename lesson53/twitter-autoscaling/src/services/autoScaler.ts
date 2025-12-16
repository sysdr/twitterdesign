import { 
  ScalingDecision, 
  ServerInstance, 
  AutoScalerConfig,
  SystemMetrics 
} from '../models/types';
import { MetricsCollector } from './metricsCollector';
import { TrafficPredictor } from './trafficPredictor';
import { CostCalculator } from './costCalculator';

export class AutoScaler {
  private config: AutoScalerConfig;
  private metricsCollector: MetricsCollector;
  private trafficPredictor: TrafficPredictor;
  private costCalculator: CostCalculator;
  private scalingHistory: ScalingDecision[] = [];
  private lastScalingTime: Date = new Date(0);
  private serverIdCounter: number = 4;

  constructor(
    config: AutoScalerConfig,
    metricsCollector: MetricsCollector,
    trafficPredictor: TrafficPredictor
  ) {
    this.config = config;
    this.metricsCollector = metricsCollector;
    this.trafficPredictor = trafficPredictor;
    this.costCalculator = new CostCalculator(config);
  }

  async makeScalingDecision(): Promise<ScalingDecision> {
    // Get current metrics
    const currentMetrics = await this.metricsCollector.collectMetrics();
    const currentServers = this.metricsCollector.getCurrentServers();
    const runningServers = currentServers.filter(s => s.status === 'running');
    
    // Calculate current load
    const currentLoad = this.calculateTotalLoad(currentMetrics);
    
    // Get traffic prediction
    const historicalMetrics = this.metricsCollector.getHistoricalMetrics(1);
    const prediction = await this.trafficPredictor.predictNextHour(historicalMetrics);
    
    // Calculate required servers
    const requiredCapacity = prediction.predictedRequestRate / this.config.targetUtilization;
    const requiredServers = Math.ceil(requiredCapacity / this.config.serverCapacity);
    
    // Constrain to min/max bounds
    const targetServers = Math.max(
      this.config.minServers,
      Math.min(this.config.maxServers, requiredServers)
    );
    
    const serversToAdd = targetServers - runningServers.length;
    
    // Check cooldown period
    const timeSinceLastScaling = Date.now() - this.lastScalingTime.getTime();
    const canScale = timeSinceLastScaling > this.config.cooldownPeriod * 1000;
    
    let approved = false;
    let reason = '';
    
    if (!canScale && serversToAdd !== 0) {
      reason = 'In cooldown period';
    } else if (serversToAdd > 0) {
      // Scale up decision
      const scalingCost = this.costCalculator.calculateScalingCost(serversToAdd, 2);
      const avgResponseTime = this.calculateAverageResponseTime(currentMetrics);
      const revenueImpact = this.costCalculator.estimateRevenueImpact(
        avgResponseTime,
        currentLoad
      );
      
      approved = this.costCalculator.isCostEffective(
        scalingCost,
        revenueImpact,
        prediction.confidence
      );
      
      if (approved) {
        reason = `Predicted load increase: ${prediction.predictedRequestRate} req/s, Current: ${Math.floor(currentLoad)} req/s`;
        await this.scaleUp(serversToAdd);
        this.lastScalingTime = new Date();
      } else {
        reason = 'Scale-up not cost effective';
      }
    } else if (serversToAdd < -1) {
      // Scale down decision (only if we have 2+ excess servers)
      approved = true;
      reason = `Predicted load decrease: ${prediction.predictedRequestRate} req/s`;
      await this.scaleDown(Math.abs(serversToAdd));
      this.lastScalingTime = new Date();
    } else {
      reason = 'Current capacity adequate';
      approved = false;
    }
    
    const decision: ScalingDecision = {
      timestamp: new Date(),
      currentServers: runningServers.length,
      targetServers,
      reason,
      predictedLoad: prediction.predictedRequestRate,
      currentLoad,
      costImpact: serversToAdd * this.config.costPerServerHour * 2,
      approved
    };
    
    this.scalingHistory.push(decision);
    if (this.scalingHistory.length > 100) {
      this.scalingHistory = this.scalingHistory.slice(-100);
    }
    
    return decision;
  }

  private calculateTotalLoad(metrics: SystemMetrics[]): number {
    return metrics.reduce((sum, m) => sum + m.requestRate, 0);
  }

  private calculateAverageResponseTime(metrics: SystemMetrics[]): number {
    if (metrics.length === 0) return 200;
    return metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
  }

  private async scaleUp(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      const newServer: ServerInstance = {
        id: `server-${this.serverIdCounter++}`,
        status: 'starting',
        region: 'us-east-1',
        capacity: this.config.serverCapacity,
        cost: this.config.costPerServerHour,
        launchedAt: new Date()
      };
      
      this.metricsCollector.addServer(newServer);
      
      // Simulate server startup time
      setTimeout(() => {
        newServer.status = 'running';
      }, 3000);
    }
  }

  private async scaleDown(count: number): Promise<void> {
    const servers = this.metricsCollector.getCurrentServers();
    const runningServers = servers
      .filter(s => s.status === 'running')
      .sort((a, b) => b.launchedAt.getTime() - a.launchedAt.getTime()); // Remove newest first
    
    const serversToRemove = runningServers.slice(0, Math.min(count, runningServers.length));
    
    serversToRemove.forEach(server => {
      this.metricsCollector.removeServer(server.id);
    });
  }

  getScalingHistory(): ScalingDecision[] {
    return this.scalingHistory;
  }

  getConfig(): AutoScalerConfig {
    return this.config;
  }
}
