import { v4 as uuidv4 } from 'uuid';
import { CostAnomaly } from '../../models/CostModels';
import { CostCalculator } from '../calculator/CostCalculator';
import { logger } from '../../utils/logger';

export class AnomalyDetector {
  private interval: NodeJS.Timeout | null = null;
  private costCalculator: CostCalculator | null = null;
  private anomalies: CostAnomaly[] = [];
  private isRunning = false;
  private costHistory: Map<string, number[]> = new Map();

  start(costCalculator: CostCalculator): void {
    if (this.isRunning) return;

    this.costCalculator = costCalculator;
    this.isRunning = true;
    
    const intervalMs = parseInt(process.env.ANOMALY_CHECK_INTERVAL || '60000');
    
    this.interval = setInterval(() => {
      this.detectAnomalies();
    }, intervalMs);

    logger.info('AnomalyDetector started');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    logger.info('AnomalyDetector stopped');
  }

  private detectAnomalies(): void {
    if (!this.costCalculator) return;

    const costsByService = this.costCalculator.getCostsByService();
    
    costsByService.forEach((cost, serviceId) => {
      this.updateHistory(serviceId, cost);
      
      const anomaly = this.checkForAnomaly(serviceId, cost);
      if (anomaly) {
        this.anomalies.push(anomaly);
        logger.warn(`Cost anomaly detected: ${anomaly.description}`);
      }
    });

    // Keep only last 24 hours of anomalies
    const oneDayAgo = new Date(Date.now() - 86400000);
    this.anomalies = this.anomalies.filter(a => a.timestamp > oneDayAgo);
  }

  private updateHistory(serviceId: string, cost: number): void {
    if (!this.costHistory.has(serviceId)) {
      this.costHistory.set(serviceId, []);
    }
    
    const history = this.costHistory.get(serviceId)!;
    history.push(cost);
    
    // Keep only last 60 data points
    if (history.length > 60) {
      history.shift();
    }
  }

  private checkForAnomaly(serviceId: string, currentCost: number): CostAnomaly | null {
    const history = this.costHistory.get(serviceId);
    if (!history || history.length < 10) return null; // Need baseline

    const stats = this.calculateStats(history);
    const zScore = (currentCost - stats.mean) / stats.stdDev;
    const threshold = parseInt(process.env.ANOMALY_STDDEV_THRESHOLD || '3');

    if (Math.abs(zScore) > threshold) {
      const deviation = ((currentCost - stats.mean) / stats.mean) * 100;
      
      return {
        id: uuidv4(),
        timestamp: new Date(),
        serviceId,
        anomalyType: zScore > 0 ? 'spike' : 'trend',
        severity: this.calculateSeverity(Math.abs(zScore)),
        currentCost: parseFloat(currentCost.toFixed(4)),
        expectedCost: parseFloat(stats.mean.toFixed(4)),
        deviation: parseFloat(deviation.toFixed(1)),
        description: `${serviceId} cost ${zScore > 0 ? 'spike' : 'drop'} detected: ${Math.abs(deviation).toFixed(1)}% ${zScore > 0 ? 'above' : 'below'} expected`,
        possibleCauses: this.identifyPossibleCauses(serviceId, deviation)
      };
    }

    return null;
  }

  private calculateStats(data: number[]): { mean: number; stdDev: number } {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev };
  }

  private calculateSeverity(zScore: number): CostAnomaly['severity'] {
    if (zScore > 5) return 'critical';
    if (zScore > 4) return 'high';
    if (zScore > 3) return 'medium';
    return 'low';
  }

  private identifyPossibleCauses(serviceId: string, deviation: number): string[] {
    const causes: string[] = [];
    
    if (deviation > 0) {
      causes.push('Traffic spike or viral content');
      causes.push('Misconfigured auto-scaling');
      causes.push('Resource leak or performance regression');
      if (serviceId.includes('database')) {
        causes.push('Inefficient queries or missing indexes');
      }
    } else {
      causes.push('Service degradation or outage');
      causes.push('Configuration change reducing usage');
    }
    
    return causes;
  }

  getRecentAnomalies(hours: number = 24): CostAnomaly[] {
    const cutoff = new Date(Date.now() - hours * 3600000);
    return this.anomalies.filter(a => a.timestamp > cutoff);
  }

  isHealthy(): boolean {
    return this.isRunning;
  }
}
