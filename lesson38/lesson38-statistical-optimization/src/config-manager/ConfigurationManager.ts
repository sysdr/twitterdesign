import { Configuration } from '../bayesian-optimizer/BayesianOptimizer';

export interface ConfigHistory {
  timestamp: number;
  configuration: Configuration;
  performanceScore: number;
  deployed: boolean;
}

export class ConfigurationManager {
  private currentConfig: Configuration;
  private history: ConfigHistory[] = [];
  private rollbackStack: Configuration[] = [];

  constructor(initialConfig: Configuration) {
    this.currentConfig = initialConfig;
    this.recordConfig(initialConfig, 0, true);
  }

  applyConfiguration(config: Configuration, performanceScore: number): void {
    // Save current config for rollback
    this.rollbackStack.push({ ...this.currentConfig });
    if (this.rollbackStack.length > 7) {
      this.rollbackStack.shift();
    }

    this.currentConfig = config;
    this.recordConfig(config, performanceScore, true);
    
    console.log('Applied new configuration:', config);
  }

  private recordConfig(config: Configuration, performanceScore: number, deployed: boolean): void {
    this.history.push({
      timestamp: Date.now(),
      configuration: { ...config },
      performanceScore,
      deployed
    });

    // Keep last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    this.history = this.history.filter(h => h.timestamp > thirtyDaysAgo);
  }

  rollback(): Configuration {
    if (this.rollbackStack.length === 0) {
      throw new Error('No configurations available for rollback');
    }

    const previous = this.rollbackStack.pop()!;
    this.currentConfig = previous;
    
    console.log('Rolled back to configuration:', previous);
    return previous;
  }

  getCurrentConfiguration(): Configuration {
    return { ...this.currentConfig };
  }

  getHistory(): ConfigHistory[] {
    return [...this.history];
  }

  getImprovementHistory(): { timestamp: number; improvement: number }[] {
    if (this.history.length < 2) {
      return [];
    }

    const baseline = this.history[0].performanceScore;
    return this.history
      .filter(h => h.deployed)
      .map(h => ({
        timestamp: h.timestamp,
        improvement: ((h.performanceScore - baseline) / baseline) * 100
      }));
  }
}
