import { NetworkMetrics, PerformancePrediction } from '../types/network';

export class PerformancePredictor {
  private historicalMetrics: NetworkMetrics[] = [];
  private baselineRTT = 0;

  recordMetrics(metrics: NetworkMetrics): void {
    this.historicalMetrics.push(metrics);
    if (this.historicalMetrics.length > 500) {
      this.historicalMetrics.shift();
    }

    // Update baseline RTT (minimum observed)
    if (this.baselineRTT === 0 || metrics.rtt < this.baselineRTT) {
      this.baselineRTT = metrics.rtt;
    }
  }

  predictLatency(queueDepth: number, serviceRate: number): PerformancePrediction {
    if (this.historicalMetrics.length < 10) {
      return {
        predictedLatency: this.baselineRTT || 50,
        confidence: 0.5,
        congestionRisk: 'low'
      };
    }

    // Calculate jitter (standard deviation of latency)
    const recentMetrics = this.historicalMetrics.slice(-50);
    const latencies = recentMetrics.map(m => m.latency);
    const mean = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const squaredDiffs = latencies.map(l => Math.pow(l - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / latencies.length;
    const jitter = Math.sqrt(variance);

    // Predict latency using queuing theory
    const queuingDelay = serviceRate > 0 ? (queueDepth / serviceRate) * 1000 : 0;
    const predictedLatency = this.baselineRTT + queuingDelay + jitter;

    // Calculate confidence based on prediction stability
    const recentPredictions = recentMetrics.map(m => m.latency);
    const predictionVariance = recentPredictions.reduce((sum, lat) => 
      sum + Math.pow(lat - predictedLatency, 2), 0) / recentPredictions.length;
    const confidence = Math.max(0.1, 1 - (Math.sqrt(predictionVariance) / predictedLatency));

    // Assess congestion risk
    let congestionRisk: 'low' | 'medium' | 'high' = 'low';
    const avgPacketLoss = recentMetrics.reduce((sum, m) => sum + m.packetLoss, 0) / recentMetrics.length;
    const latencyIncrease = (mean - this.baselineRTT) / this.baselineRTT;

    if (avgPacketLoss > 3 || latencyIncrease > 0.5) {
      congestionRisk = 'high';
    } else if (avgPacketLoss > 1.5 || latencyIncrease > 0.25) {
      congestionRisk = 'medium';
    }

    return {
      predictedLatency,
      confidence: Math.min(0.99, confidence),
      congestionRisk
    };
  }

  getBaselineRTT(): number {
    return this.baselineRTT;
  }
}
