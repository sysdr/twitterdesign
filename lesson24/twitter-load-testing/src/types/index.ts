export interface Region {
  id: string;
  name: string;
  endpoint: string;
  location: { lat: number; lng: number };
  status: 'active' | 'degraded' | 'offline';
}

export interface LoadTestConfig {
  duration: number;
  concurrentUsers: number;
  rampUpTime: number;
  regions: string[];
  scenarios: TestScenario[];
}

export interface TestScenario {
  id: string;
  name: string;
  actions: TestAction[];
  weight: number;
}

export interface TestAction {
  type: 'get' | 'post' | 'put' | 'delete';
  endpoint: string;
  payload?: any;
  expectedStatus: number;
}

export interface LoadTestMetrics {
  region: string;
  timestamp: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  activeUsers: number;
}

export interface RegionalPerformance {
  region: string;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  successRate: number;
  throughput: number;
}
