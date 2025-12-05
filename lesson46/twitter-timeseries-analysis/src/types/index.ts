export interface MetricData {
  timestamp: number;
  value: number;
  metricName: string;
}

export interface AnomalyDetection {
  timestamp: number;
  value: number;
  expectedValue: number;
  zScore: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface ForecastPoint {
  timestamp: number;
  predicted: number;
  confidenceUpper: number;
  confidenceLower: number;
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  confidence: number;
}

export interface TimeSeriesState {
  currentValue: number;
  anomalyCount: number;
  forecastAccuracy: number;
  trend: TrendAnalysis;
}
