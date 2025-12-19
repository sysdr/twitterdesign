import { MetricsCollector } from '../collectors/MetricsCollector';
import { PerformanceAnalyzer } from '../analyzers/PerformanceAnalyzer';

export interface TestConfig {
  name: string;
  concurrentUsers: number;
  duration: number; // seconds
  endpoints: string[];
  rampUp: number; // seconds
}

export interface TestResult {
  testName: string;
  startTime: number;
  endTime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatency: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number;
  budgetCompliance: boolean;
}

export class TestOrchestrator {
  private collector: MetricsCollector;
  private analyzer: PerformanceAnalyzer;
  private running = false;

  constructor(collector: MetricsCollector, analyzer: PerformanceAnalyzer) {
    this.collector = collector;
    this.analyzer = analyzer;
  }

  async runTest(config: TestConfig): Promise<TestResult> {
    console.log(`Starting test: ${config.name}`);
    console.log(`Users: ${config.concurrentUsers}, Duration: ${config.duration}s`);

    this.running = true;
    const startTime = Date.now();
    const latencies: number[] = [];
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;

    // Ramp up users
    const usersPerSecond = config.concurrentUsers / config.rampUp;
    let currentUsers = 0;

    const rampUpInterval = setInterval(() => {
      if (currentUsers < config.concurrentUsers) {
        currentUsers = Math.min(currentUsers + usersPerSecond, config.concurrentUsers);
      }
    }, 1000);

    // Run test
    const testPromise = new Promise<void>((resolve) => {
      const testInterval = setInterval(async () => {
        if (Date.now() - startTime > config.duration * 1000) {
          clearInterval(testInterval);
          clearInterval(rampUpInterval);
          this.running = false;
          resolve();
          return;
        }

        // Simulate concurrent requests
        const requests = Math.floor(currentUsers);
        for (let i = 0; i < requests; i++) {
          const endpoint = config.endpoints[Math.floor(Math.random() * config.endpoints.length)];
          const requestStart = Date.now();

          try {
            // Simulate request
            await this.simulateRequest(endpoint);
            const latency = Date.now() - requestStart;
            
            latencies.push(latency);
            this.collector.recordTiming(endpoint, latency);
            successfulRequests++;
          } catch (error) {
            failedRequests++;
          }
          totalRequests++;
        }
      }, 1000);
    });

    await testPromise;

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    const percentiles = this.collector.calculatePercentiles(latencies);

    // Check budget compliance
    let budgetCompliance = true;
    for (const endpoint of config.endpoints) {
      const endpointLatencies = latencies; // Simplified - would filter by endpoint
      const compliance = this.analyzer.checkBudgetCompliance(endpoint, endpointLatencies);
      if (!compliance.compliant) {
        budgetCompliance = false;
        console.log(`Budget violations for ${endpoint}:`);
        compliance.violations.forEach(v => console.log(`  - ${v}`));
      }
    }

    const result: TestResult = {
      testName: config.name,
      startTime,
      endTime,
      totalRequests,
      successfulRequests,
      failedRequests,
      avgLatency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
      p50: percentiles.p50,
      p95: percentiles.p95,
      p99: percentiles.p99,
      throughput: totalRequests / duration,
      budgetCompliance
    };

    console.log('\nTest Results:');
    console.log(`Total Requests: ${result.totalRequests}`);
    console.log(`Success Rate: ${(result.successfulRequests / result.totalRequests * 100).toFixed(2)}%`);
    console.log(`Avg Latency: ${result.avgLatency.toFixed(2)}ms`);
    console.log(`P50: ${result.p50}ms, P95: ${result.p95}ms, P99: ${result.p99}ms`);
    console.log(`Throughput: ${result.throughput.toFixed(2)} req/s`);
    console.log(`Budget Compliant: ${result.budgetCompliance ? 'YES' : 'NO'}`);

    return result;
  }

  private async simulateRequest(endpoint: string): Promise<void> {
    // Simulate different endpoint latencies
    let baseLatency = 20;
    let variance = 10;

    if (endpoint.includes('timeline')) {
      baseLatency = 25;
      variance = 15;
    } else if (endpoint.includes('tweet')) {
      baseLatency = 30;
      variance = 20;
    } else if (endpoint.includes('db')) {
      baseLatency = 10;
      variance = 5;
    }

    const latency = baseLatency + (Math.random() * variance * 2 - variance);
    await new Promise(resolve => setTimeout(resolve, Math.max(latency, 1)));
  }

  async runTestSuite(): Promise<TestResult[]> {
    const tests: TestConfig[] = [
      {
        name: 'Smoke Test',
        concurrentUsers: 100,
        duration: 60,
        endpoints: ['api.tweet.create', 'api.timeline.fetch'],
        rampUp: 10
      },
      {
        name: 'Regression Test',
        concurrentUsers: 500,
        duration: 300,
        endpoints: ['api.tweet.create', 'api.timeline.fetch', 'db.query.user'],
        rampUp: 30
      },
      {
        name: 'Stress Test',
        concurrentUsers: 1000,
        duration: 180,
        endpoints: ['api.tweet.create', 'api.timeline.fetch', 'cache.operation'],
        rampUp: 60
      }
    ];

    const results: TestResult[] = [];

    for (const test of tests) {
      console.log(`\n${'='.repeat(50)}`);
      const result = await this.runTest(test);
      results.push(result);
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    return results;
  }
}
