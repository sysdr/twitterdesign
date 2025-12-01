export interface NetworkMetrics {
  timestamp: number;
  latency: number;
  throughput: number;
  packetLoss: number;
  retransmissions: number;
  congestionWindow: number;
  rtt: number;
}

export interface TCPConfig {
  initialWindow: number;
  selectiveAck: boolean;
  fastRetransmitThreshold: number;
  maxRetransmitTimeout: number;
}

export interface TrafficClass {
  name: string;
  weight: number;
  tokens: number;
  capacity: number;
  rate: number;
}

export interface BandwidthAllocation {
  totalBandwidth: number;
  classes: Map<string, TrafficClass>;
}

export interface PerformancePrediction {
  predictedLatency: number;
  confidence: number;
  congestionRisk: 'low' | 'medium' | 'high';
}

export interface NetworkCondition {
  type: 'fiber' | 'mobile-4g' | 'congested' | 'high-latency';
  baselineRTT: number;
  packetLoss: number;
  bandwidth: number;
}

export interface OptimizationResult {
  before: NetworkMetrics;
  after: NetworkMetrics;
  improvement: number;
}
