import { Statistics } from '../utils/statistics';
import { ForecastPoint } from '../types';

export class ForecastEngine {
  private history: number[] = [];
  private readonly maxHistory = 600; // 10 minutes

  addDataPoint(value: number): void {
    this.history.push(value);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  // Simple ARIMA-inspired forecasting using exponential smoothing and trend
  forecast(steps: number): ForecastPoint[] {
    if (this.history.length < 30) {
      return []; // Need minimum data for forecasting
    }

    const ema = Statistics.exponentialMovingAverage(this.history, 0.3);
    const lastEma = ema[ema.length - 1];
    
    // Calculate trend from recent data
    const recentData = this.history.slice(-60); // Last minute
    const trend = this.calculateTrend(recentData);
    
    const stdDev = Statistics.standardDeviation(this.history);
    const forecasts: ForecastPoint[] = [];
    
    for (let i = 1; i <= steps; i++) {
      const predicted = lastEma + (trend * i);
      const confidence = stdDev * Math.sqrt(i); // Confidence interval widens with time
      
      forecasts.push({
        timestamp: Date.now() + (i * 1000),
        predicted,
        confidenceUpper: predicted + (confidence * 1.96), // 95% CI
        confidenceLower: predicted - (confidence * 1.96)
      });
    }
    
    return forecasts;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    // Simple linear regression slope
    const n = values.length;
    const xSum = (n * (n + 1)) / 2;
    const xSquareSum = (n * (n + 1) * (2 * n + 1)) / 6;
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, idx) => sum + val * (idx + 1), 0);
    
    const slope = (n * xySum - xSum * ySum) / (n * xSquareSum - xSum * xSum);
    return slope;
  }
}
