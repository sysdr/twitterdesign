import { CacheStats } from '../../types';
import { MultiTierCacheService } from '../cache/MultiTierCacheService';

export class MonitoringService {
  private cacheService: MultiTierCacheService;
  private metricsHistory: (CacheStats & { timestamp: number })[] = [];
  private alerts: string[] = [];

  constructor(cacheService: MultiTierCacheService) {
    this.cacheService = cacheService;
    this.startMetricsCollection();
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      const currentStats = this.cacheService.getStats();
      this.metricsHistory.push({
        ...currentStats,
        timestamp: Date.now()
      });

      // Keep only last 100 metrics for memory efficiency
      if (this.metricsHistory.length > 100) {
        this.metricsHistory.shift();
      }

      this.checkAlerts(currentStats);
    }, 5000); // Collect metrics every 5 seconds
  }

  private checkAlerts(stats: CacheStats): void {
    // Alert if hit rate drops below 95%
    if (stats.hitRate < 95) {
      this.addAlert(`Low cache hit rate: ${stats.hitRate.toFixed(2)}%`);
    }

    // Alert if bloom filter false positive rate is too high
    if (stats.bloomFilterStats.falsePositiveRate > 0.1) {
      this.addAlert(`High bloom filter false positive rate: ${(stats.bloomFilterStats.falsePositiveRate * 100).toFixed(2)}%`);
    }

    // Alert if L1 cache is too full (efficiency drop)
    if (stats.tierStats.L1.entries > 8000) {
      this.addAlert(`L1 cache approaching capacity: ${stats.tierStats.L1.entries} entries`);
    }
  }

  private addAlert(message: string): void {
    const alert = `${new Date().toISOString()}: ${message}`;
    this.alerts.push(alert);
    console.warn('🚨 Cache Alert:', alert);

    // Keep only last 20 alerts
    if (this.alerts.length > 20) {
      this.alerts.shift();
    }
  }

  getMetricsHistory(): (CacheStats & { timestamp: number })[] {
    return [...this.metricsHistory];
  }

  getAlerts(): string[] {
    return [...this.alerts];
  }

  getCurrentStats(): CacheStats {
    return this.cacheService.getStats();
  }

  generateReport(): {
    summary: string;
    recommendations: string[];
    performance: {
      averageHitRate: number;
      peakHitRate: number;
      efficiencyTrend: 'improving' | 'declining' | 'stable';
    };
  } {
    let recentStats = this.metricsHistory.slice(-10);
    if (recentStats.length === 0) {
      // Fallback to current stats if history hasn't been populated yet
      const current = this.cacheService.getStats();
      recentStats = [{ ...current, timestamp: Date.now() }];
    }
    const averageHitRate = recentStats.reduce((sum, stat) => sum + stat.hitRate, 0) / recentStats.length;
    const peakHitRate = Math.max(...recentStats.map(stat => stat.hitRate));
    
    const trend = this.calculateTrend(recentStats.map(stat => stat.hitRate));
    
    return {
      summary: `Cache system performance: ${averageHitRate.toFixed(2)}% average hit rate with ${this.alerts.length} recent alerts`,
      recommendations: this.generateRecommendations(recentStats),
      performance: {
        averageHitRate,
        peakHitRate,
        efficiencyTrend: trend
      }
    };
  }

  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 1) return 'improving';
    if (difference < -1) return 'declining';
    return 'stable';
  }

  private generateRecommendations(recentStats: CacheStats[]): string[] {
    const recommendations: string[] = [];
    if (recentStats.length === 0) return recommendations;
    const latest = recentStats[recentStats.length - 1];
    
    if (latest.hitRate < 98) {
      recommendations.push('Consider adjusting cache warming algorithms to improve hit rate');
    }
    
    if (latest.bloomFilterStats.falsePositiveRate > 0.05) {
      recommendations.push('Increase bloom filter size or reduce hash functions to lower false positive rate');
    }
    
    if (latest.tierStats.L1.entries / (latest.tierStats.L1.entries + latest.tierStats.L2.entries + latest.tierStats.L3.entries) > 0.5) {
      recommendations.push('Rebalance cache tiers - L1 cache has too many entries');
    }
    
    return recommendations;
  }
}
