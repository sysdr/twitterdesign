import { MetricData } from '../types';

export class MetricsGenerator {
  private baseValue = 100;
  private timeOffset = 0;
  private anomalyProbability = 0.05;

  generateMetric(metricName: string): MetricData {
    const timestamp = Date.now() + this.timeOffset;
    this.timeOffset += 1000; // 1 second

    // Generate realistic metric with seasonality and noise
    const hourOfDay = new Date(timestamp).getHours();
    const seasonal = Math.sin((hourOfDay / 24) * Math.PI * 2) * 20;
    const noise = (Math.random() - 0.5) * 10;
    
    let value = this.baseValue + seasonal + noise;

    // Inject anomalies randomly
    if (Math.random() < this.anomalyProbability) {
      const anomalyMultiplier = Math.random() > 0.5 ? 2 : 0.5;
      value *= anomalyMultiplier;
    }

    return {
      timestamp,
      value,
      metricName
    };
  }

  generateBatch(count: number, metricName: string): MetricData[] {
    return Array.from({ length: count }, () => this.generateMetric(metricName));
  }

  reset(): void {
    this.timeOffset = 0;
  }
}
