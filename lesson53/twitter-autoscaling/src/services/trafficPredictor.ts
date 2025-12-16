import { SystemMetrics, TrafficPrediction } from '../models/types';

export class TrafficPredictor {
  private historicalPredictions: TrafficPrediction[] = [];

  async predictNextHour(historicalMetrics: SystemMetrics[]): Promise<TrafficPrediction> {
    const requestRates = this.extractRequestRates(historicalMetrics);
    
    if (requestRates.length < 10) {
      // Not enough data, use current average
      const avgRate = requestRates.reduce((a, b) => a + b, 0) / requestRates.length || 100;
      return {
        timestamp: new Date(),
        predictedRequestRate: avgRate,
        confidence: 0.5,
        historicalData: requestRates,
        trend: 0
      };
    }

    // Apply exponential smoothing
    const alpha = 0.3; // Smoothing factor
    let smoothedValue = requestRates[0];
    
    for (let i = 1; i < requestRates.length; i++) {
      smoothedValue = alpha * requestRates[i] + (1 - alpha) * smoothedValue;
    }

    // Calculate trend
    const trend = this.calculateTrend(requestRates);
    
    // Apply trend to prediction
    const prediction = smoothedValue * (1 + trend);
    
    // Add time-of-day adjustment
    const hourAdjustment = this.getHourlyAdjustment();
    const finalPrediction = prediction * hourAdjustment;

    // Calculate confidence based on data consistency
    const confidence = this.calculateConfidence(requestRates);

    const predictionResult: TrafficPrediction = {
      timestamp: new Date(),
      predictedRequestRate: Math.floor(finalPrediction),
      confidence,
      historicalData: requestRates,
      trend
    };

    this.historicalPredictions.push(predictionResult);
    if (this.historicalPredictions.length > 100) {
      this.historicalPredictions = this.historicalPredictions.slice(-100);
    }

    return predictionResult;
  }

  private extractRequestRates(metrics: SystemMetrics[]): number[] {
    const ratesByTime: Map<number, number[]> = new Map();
    
    metrics.forEach(m => {
      const timeKey = Math.floor(m.timestamp.getTime() / 30000); // 30-second buckets
      if (!ratesByTime.has(timeKey)) {
        ratesByTime.set(timeKey, []);
      }
      ratesByTime.get(timeKey)!.push(m.requestRate);
    });

    // Average rates per time bucket
    const rates: number[] = [];
    ratesByTime.forEach(ratesInBucket => {
      const avg = ratesInBucket.reduce((a, b) => a + b, 0) / ratesInBucket.length;
      rates.push(avg);
    });

    return rates;
  }

  private calculateTrend(data: number[]): number {
    if (data.length < 5) return 0;

    const recent = data.slice(-5);
    const older = data.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / (older.length || 1);
    
    if (olderAvg === 0) return 0;
    
    return (recentAvg - olderAvg) / olderAvg;
  }

  private getHourlyAdjustment(): number {
    const hour = new Date().getHours();
    
    // Peak hours (9am-5pm): +20%
    if (hour >= 9 && hour <= 17) {
      return 1.2;
    }
    // Evening (6pm-11pm): normal
    else if (hour >= 18 && hour <= 23) {
      return 1.0;
    }
    // Night (12am-8am): -40%
    else {
      return 0.6;
    }
  }

  private calculateConfidence(data: number[]): number {
    if (data.length < 10) return 0.5;

    // Calculate coefficient of variation
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;

    // Lower CV = higher confidence
    return Math.max(0.3, Math.min(0.95, 1 - cv));
  }

  getPredictionAccuracy(): number {
    if (this.historicalPredictions.length < 2) return 0;

    let totalError = 0;
    let count = 0;

    for (let i = 1; i < this.historicalPredictions.length; i++) {
      const predicted = this.historicalPredictions[i - 1].predictedRequestRate;
      const actual = this.historicalPredictions[i].historicalData[0] || predicted;
      const error = Math.abs(predicted - actual) / actual;
      totalError += error;
      count++;
    }

    const avgError = totalError / count;
    return Math.max(0, 1 - avgError);
  }
}

export const trafficPredictor = new TrafficPredictor();
