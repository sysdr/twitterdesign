export interface QueueMetrics {
  arrivalRate: number;        // λ (lambda) - arrivals per second
  serviceRate: number;         // μ (mu) - completions per second
  queueLength: number;         // L - items in system
  utilization: number;         // ρ (rho) - λ/μ
  averageWaitTime: number;     // W - time in system
  timestamp: number;
}

export interface QueueState {
  name: string;
  metrics: QueueMetrics;
  prediction: QueuePrediction;
  health: 'healthy' | 'warning' | 'critical';
}

export interface QueuePrediction {
  predictedUtilization: number;
  predictedWaitTime: number;
  predictedQueueLength: number;
  scalingRecommendation: ScalingRecommendation;
  timeToThreshold: number;    // seconds until threshold breach
}

export interface ScalingRecommendation {
  action: 'none' | 'scale_up' | 'scale_down';
  targetServers: number;
  currentServers: number;
  reason: string;
  confidence: number;
}

export interface SystemMetrics {
  queues: QueueState[];
  totalThroughput: number;
  overallHealth: 'healthy' | 'warning' | 'critical';
  timestamp: number;
}
