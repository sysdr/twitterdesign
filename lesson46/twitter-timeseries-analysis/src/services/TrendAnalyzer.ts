import { Statistics } from '../utils/statistics';
import { TrendAnalysis } from '../types';

export class TrendAnalyzer {
  analyze(values: number[]): TrendAnalysis {
    if (values.length < 10) {
      return {
        trend: 'stable',
        changeRate: 0,
        confidence: 0
      };
    }

    // Compare recent average to older average
    const recent = values.slice(-30);
    const older = values.slice(-60, -30);
    
    const recentAvg = Statistics.mean(recent);
    const olderAvg = Statistics.mean(older);
    
    const changeRate = ((recentAvg - olderAvg) / olderAvg) * 100;
    const stdDev = Statistics.standardDeviation(values);
    const confidence = Math.min(100, Math.abs(changeRate) / (stdDev + 0.01) * 100);
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(changeRate) < 2) {
      trend = 'stable';
    } else if (changeRate > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return {
      trend,
      changeRate,
      confidence
    };
  }
}
