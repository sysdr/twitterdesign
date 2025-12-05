import { AnomalyDetector } from './AnomalyDetector';
import { ForecastEngine } from './ForecastEngine';
import { TrendAnalyzer } from './TrendAnalyzer';
import { MetricData, AnomalyDetection, ForecastPoint, TrendAnalysis } from '../types';

export class TimeSeriesService {
  private anomalyDetector: AnomalyDetector;
  private forecastEngine: ForecastEngine;
  private trendAnalyzer: TrendAnalyzer;
  private allValues: number[] = [];

  constructor() {
    this.anomalyDetector = new AnomalyDetector();
    this.forecastEngine = new ForecastEngine();
    this.trendAnalyzer = new TrendAnalyzer();
  }

  processMetric(metric: MetricData): {
    anomaly: AnomalyDetection;
    forecast: ForecastPoint[];
    trend: TrendAnalysis;
  } {
    this.allValues.push(metric.value);
    this.forecastEngine.addDataPoint(metric.value);

    const anomaly = this.anomalyDetector.detect(metric.timestamp, metric.value);
    const forecast = this.forecastEngine.forecast(60); // 60 seconds ahead
    const trend = this.trendAnalyzer.analyze(this.allValues);

    return {
      anomaly,
      forecast,
      trend
    };
  }

  getHistory(): number[] {
    return [...this.allValues];
  }
}
