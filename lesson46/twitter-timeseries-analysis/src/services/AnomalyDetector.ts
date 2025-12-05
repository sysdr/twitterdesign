import { Statistics } from '../utils/statistics';
import { TimeSeriesModel } from '../models/TimeSeriesModel';
import { AnomalyDetection } from '../types';

export class AnomalyDetector {
  private model: TimeSeriesModel;
  private readonly thresholds = {
    low: 2,
    medium: 3,
    high: 4
  };

  constructor() {
    this.model = new TimeSeriesModel();
  }

  detect(timestamp: number, value: number): AnomalyDetection {
    this.model.addDataPoint(value);
    
    const mean = this.model.getMean();
    const stdDev = this.model.getStdDev();
    const zScore = Statistics.zScore(value, mean, stdDev);
    
    const absZScore = Math.abs(zScore);
    let isAnomaly = false;
    let severity: 'low' | 'medium' | 'high' = 'low';

    if (absZScore > this.thresholds.high) {
      isAnomaly = true;
      severity = 'high';
    } else if (absZScore > this.thresholds.medium) {
      isAnomaly = true;
      severity = 'medium';
    } else if (absZScore > this.thresholds.low) {
      isAnomaly = true;
      severity = 'low';
    }

    return {
      timestamp,
      value,
      expectedValue: mean,
      zScore,
      isAnomaly,
      severity
    };
  }

  getModel(): TimeSeriesModel {
    return this.model;
  }
}
