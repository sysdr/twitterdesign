import { NetworkMetrics, NetworkCondition } from '../types/network';

export class NetworkMonitor {
  private metrics: NetworkMetrics[] = [];
  private readonly maxMetrics = 1000;
  private smoothedRTT = 0;
  private readonly alpha = 0.2; // EWMA smoothing factor
  
  constructor(private onMetricUpdate?: (metric: NetworkMetrics) => void) {}

  recordMetric(metric: NetworkMetrics): void {
    // Update smoothed RTT using EWMA
    if (this.smoothedRTT === 0) {
      this.smoothedRTT = metric.rtt;
    } else {
      this.smoothedRTT = (1 - this.alpha) * this.smoothedRTT + this.alpha * metric.rtt;
    }

    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    if (this.onMetricUpdate) {
      this.onMetricUpdate(metric);
    }
  }

  getSmoothedRTT(): number {
    return this.smoothedRTT;
  }

  getRecentMetrics(count: number = 100): NetworkMetrics[] {
    return this.metrics.slice(-count);
  }

  calculatePercentile(percentile: number): number {
    if (this.metrics.length === 0) return 0;
    
    const latencies = this.metrics.map(m => m.latency).sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * latencies.length);
    return latencies[Math.min(index, latencies.length - 1)];
  }

  getAverageLatency(): number {
    if (this.metrics.length === 0) return 0;
    return this.metrics.reduce((sum, m) => sum + m.latency, 0) / this.metrics.length;
  }

  getPacketLossRate(): number {
    if (this.metrics.length === 0) return 0;
    const recentMetrics = this.getRecentMetrics(100);
    return recentMetrics.reduce((sum, m) => sum + m.packetLoss, 0) / recentMetrics.length;
  }

  detectNetworkCondition(): NetworkCondition {
    const rtt = this.getSmoothedRTT();
    const loss = this.getPacketLossRate();

    // Default values if no metrics recorded yet
    const defaultRTT = rtt > 0 ? rtt : 50;
    const defaultLoss = loss > 0 ? loss : 0.5;

    if (defaultRTT < 20 && defaultLoss < 0.5) {
      return {
        type: 'fiber',
        baselineRTT: defaultRTT,
        packetLoss: defaultLoss,
        bandwidth: 100 // Mbps
      };
    } else if (defaultRTT < 100 && defaultLoss < 2) {
      return {
        type: 'mobile-4g',
        baselineRTT: defaultRTT,
        packetLoss: defaultLoss,
        bandwidth: 20
      };
    } else if (defaultLoss > 3 || defaultRTT > 200) {
      return {
        type: 'congested',
        baselineRTT: defaultRTT,
        packetLoss: defaultLoss,
        bandwidth: 5
      };
    } else {
      return {
        type: 'high-latency',
        baselineRTT: defaultRTT,
        packetLoss: defaultLoss,
        bandwidth: 50
      };
    }
  }

  getJitter(): number {
    if (this.metrics.length < 2) return 0;
    
    const recentMetrics = this.getRecentMetrics(50);
    const latencies = recentMetrics.map(m => m.latency);
    const mean = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const squaredDiffs = latencies.map(l => Math.pow(l - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / latencies.length;
    
    return Math.sqrt(variance);
  }
}
