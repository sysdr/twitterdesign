import { CostForecast } from '../types';
import { mean, standardDeviation } from 'simple-statistics';

export class PredictiveAnalytics {
  private historicalCosts: { date: Date; cost: number }[] = [];

  addHistoricalData(date: Date, cost: number): void {
    this.historicalCosts.push({ date, cost });
    
    // Keep last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 3600000;
    this.historicalCosts = this.historicalCosts.filter(
      h => h.date.getTime() > thirtyDaysAgo
    );
  }

  forecastNextWeek(): CostForecast[] {
    if (this.historicalCosts.length < 7) {
      // Not enough data, return simple projection
      const avgCost = this.historicalCosts.length > 0
        ? mean(this.historicalCosts.map(h => h.cost))
        : 50;

      return Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + (i + 1) * 24 * 3600000),
        predictedCost: avgCost,
        confidence: 0.5,
        upperBound: avgCost * 1.2,
        lowerBound: avgCost * 0.8
      }));
    }

    // Simple exponential smoothing
    const costs = this.historicalCosts.map(h => h.cost);
    const avg = mean(costs);
    const stdDev = standardDeviation(costs);

    // Calculate trend
    const recentCosts = costs.slice(-7);
    const trend = recentCosts.length > 1
      ? (recentCosts[recentCosts.length - 1] - recentCosts[0]) / recentCosts.length
      : 0;

    return Array.from({ length: 7 }, (_, i) => {
      const dayOffset = i + 1;
      const predictedCost = avg + trend * dayOffset;
      const confidence = Math.max(0.6, 1 - (dayOffset * 0.05));

      return {
        date: new Date(Date.now() + dayOffset * 24 * 3600000),
        predictedCost: Math.max(0, predictedCost),
        confidence,
        upperBound: predictedCost + stdDev * 1.5,
        lowerBound: Math.max(0, predictedCost - stdDev * 1.5)
      };
    });
  }

  calculateBudgetBurnRate(currentCost: number, budgetLimit: number): {
    dailyBurnRate: number;
    daysUntilBudgetExceeded: number;
    isOnTrack: boolean;
  } {
    const dailyBurnRate = currentCost;
    const daysUntilBudgetExceeded = dailyBurnRate > 0
      ? budgetLimit / dailyBurnRate
      : Infinity;

    return {
      dailyBurnRate,
      daysUntilBudgetExceeded,
      isOnTrack: daysUntilBudgetExceeded > 30
    };
  }

  getTrendAnalysis(): { trend: 'increasing' | 'decreasing' | 'stable'; percentage: number } {
    if (this.historicalCosts.length < 7) {
      return { trend: 'stable', percentage: 0 };
    }

    const recent = this.historicalCosts.slice(-7).map(h => h.cost);
    const older = this.historicalCosts.slice(-14, -7).map(h => h.cost);

    if (older.length === 0) {
      return { trend: 'stable', percentage: 0 };
    }

    const recentAvg = mean(recent);
    const olderAvg = mean(older);
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (Math.abs(change) < 5) {
      return { trend: 'stable', percentage: change };
    }

    return {
      trend: change > 0 ? 'increasing' : 'decreasing',
      percentage: Math.abs(change)
    };
  }
}
