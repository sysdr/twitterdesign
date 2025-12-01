import { TCPConfig, NetworkCondition } from '../types/network';

export class TCPOptimizer {
  private config: TCPConfig = {
    initialWindow: 10,
    selectiveAck: true,
    fastRetransmitThreshold: 3,
    maxRetransmitTimeout: 3000
  };

  optimizeForCondition(condition: NetworkCondition): TCPConfig {
    const optimized = { ...this.config };

    switch (condition.type) {
      case 'fiber':
        // Fast network - use standard settings
        optimized.initialWindow = 10;
        optimized.fastRetransmitThreshold = 3;
        optimized.maxRetransmitTimeout = 3000;
        break;

      case 'mobile-4g':
        // Mobile network - increase initial window and quick retransmit
        optimized.initialWindow = 14;
        optimized.fastRetransmitThreshold = 2;
        optimized.maxRetransmitTimeout = Math.max(1500, condition.baselineRTT * 1.5);
        break;

      case 'congested':
        // Congested network - conservative settings
        optimized.initialWindow = 6;
        optimized.fastRetransmitThreshold = 2;
        optimized.maxRetransmitTimeout = Math.max(2000, condition.baselineRTT * 2);
        break;

      case 'high-latency':
        // High latency - maximize initial window, quick recovery
        optimized.initialWindow = 16;
        optimized.fastRetransmitThreshold = 2;
        optimized.maxRetransmitTimeout = Math.max(1000, condition.baselineRTT * 1.2);
        break;
    }

    this.config = optimized;
    return optimized;
  }

  getCurrentConfig(): TCPConfig {
    return { ...this.config };
  }

  calculateRetransmitTimeout(rtt: number): number {
    // Calculate RTO based on current config
    return Math.min(
      this.config.maxRetransmitTimeout,
      Math.max(1000, rtt * (this.config.maxRetransmitTimeout / 3000))
    );
  }
}
