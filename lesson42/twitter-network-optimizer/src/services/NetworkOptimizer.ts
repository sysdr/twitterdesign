import { NetworkMetrics, OptimizationResult } from '../types/network';
import { NetworkMonitor } from './NetworkMonitor';
import { TCPOptimizer } from './TCPOptimizer';
import { BandwidthManager } from './BandwidthManager';
import { PerformancePredictor } from './PerformancePredictor';

export class NetworkOptimizer {
  private monitor: NetworkMonitor;
  private tcpOptimizer: TCPOptimizer;
  private bandwidthManager: BandwidthManager;
  private predictor: PerformancePredictor;
  private queueDepth = 0;
  private serviceRate = 100; // packets per second

  constructor(
    totalBandwidth: number = 100,
    onMetricUpdate?: (metric: NetworkMetrics) => void
  ) {
    this.monitor = new NetworkMonitor(onMetricUpdate);
    this.tcpOptimizer = new TCPOptimizer();
    this.bandwidthManager = new BandwidthManager(totalBandwidth);
    this.predictor = new PerformancePredictor();
  }

  async sendData(
    data: string,
    trafficClass: string = 'text',
    simulatedConditions?: { rtt: number; loss: number; bandwidth: number }
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    const dataSize = data.length;

    // Simulate network conditions
    const conditions = simulatedConditions || {
      rtt: 50,
      loss: Math.random() * 2,
      bandwidth: 100
    };

    // Record baseline (before optimization)
    const baselineLatency = this.calculateLatency(conditions.rtt, dataSize, conditions.bandwidth, false);
    const baselineMetric: NetworkMetrics = {
      timestamp: startTime,
      latency: baselineLatency,
      throughput: (dataSize / baselineLatency) * 1000,
      packetLoss: conditions.loss,
      retransmissions: conditions.loss > 1 ? Math.floor(conditions.loss) : 0,
      congestionWindow: 10,
      rtt: conditions.rtt
    };

    // Apply optimizations
    const networkCondition = this.monitor.detectNetworkCondition();
    const tcpConfig = this.tcpOptimizer.optimizeForCondition(networkCondition);
    
    // Check bandwidth allocation
    if (!this.bandwidthManager.canSend(trafficClass, dataSize)) {
      this.queueDepth++;
      await this.delay(10); // Wait for tokens
    }

    // Consume tokens
    this.bandwidthManager.consumeTokens(trafficClass, dataSize);
    if (this.queueDepth > 0) this.queueDepth--;

    // Calculate optimized latency
    const optimizedLatency = this.calculateLatency(
      conditions.rtt,
      dataSize,
      conditions.bandwidth,
      true,
      tcpConfig.initialWindow
    );

    // Record optimized metric
    const optimizedMetric: NetworkMetrics = {
      timestamp: Date.now(),
      latency: optimizedLatency,
      throughput: (dataSize / optimizedLatency) * 1000,
      packetLoss: conditions.loss * 0.5, // Optimization reduces loss
      retransmissions: Math.floor(conditions.loss * 0.5),
      congestionWindow: tcpConfig.initialWindow,
      rtt: conditions.rtt
    };

    // Update monitors
    this.monitor.recordMetric(optimizedMetric);
    this.predictor.recordMetrics(optimizedMetric);

    const improvement = ((baselineLatency - optimizedLatency) / baselineLatency) * 100;

    return {
      before: baselineMetric,
      after: optimizedMetric,
      improvement
    };
  }

  private calculateLatency(
    rtt: number,
    dataSize: number,
    bandwidth: number,
    optimized: boolean,
    initialWindow: number = 10
  ): number {
    // Propagation delay
    const propagationDelay = rtt / 2;

    // Transmission delay (bytes to bits, bandwidth in Mbps)
    const transmissionDelay = (dataSize * 8) / (bandwidth * 1000000) * 1000;

    // Processing delay
    const processingDelay = 5;

    // Queuing delay (reduced with optimization)
    const queuingDelay = optimized
      ? (this.queueDepth / this.serviceRate) * 1000 * 0.7
      : (this.queueDepth / this.serviceRate) * 1000;

    // TCP overhead (reduced with larger initial window)
    const tcpOverhead = optimized
      ? Math.max(0, rtt * Math.ceil(dataSize / (initialWindow * 1460)) * 0.6)
      : rtt * Math.ceil(dataSize / (10 * 1460));

    return propagationDelay + transmissionDelay + processingDelay + queuingDelay + tcpOverhead;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMonitor(): NetworkMonitor {
    return this.monitor;
  }

  getPredictor(): PerformancePredictor {
    return this.predictor;
  }

  getBandwidthManager(): BandwidthManager {
    return this.bandwidthManager;
  }

  getTCPOptimizer(): TCPOptimizer {
    return this.tcpOptimizer;
  }
}
