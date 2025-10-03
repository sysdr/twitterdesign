import { LoadTestConfig, LoadTestMetrics, TestScenario, Region } from '../types';

export class LoadGeneratorService {
  private metrics: LoadTestMetrics[] = [];
  private activeTests: Map<string, boolean> = new Map();

  async startRegionalTest(region: Region, config: LoadTestConfig): Promise<void> {
    console.log(`Starting load test in region: ${region.name}`);
    this.activeTests.set(region.id, true);

    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);

    while (Date.now() < endTime && this.activeTests.get(region.id)) {
      for (const scenario of config.scenarios) {
        await this.executeScenario(region, scenario);
      }
      await this.sleep(100); // 100ms between iterations
    }

    this.activeTests.set(region.id, false);
    console.log(`Load test completed in region: ${region.name}`);
  }

  private async executeScenario(region: Region, scenario: TestScenario): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate HTTP requests to different endpoints
      for (const action of scenario.actions) {
        const response = await this.simulateRequest(region, action);
        const responseTime = Date.now() - startTime;
        
        this.recordMetrics(region.id, responseTime, response.success);
      }
    } catch (error) {
      this.recordMetrics(region.id, Date.now() - startTime, false);
    }
  }

  private async simulateRequest(region: Region, _action: any): Promise<{ success: boolean; responseTime: number }> {
    // Simulate network latency based on region
    const baseLatency = this.getRegionLatency(region.id);
    const jitter = Math.random() * 50;
    const totalLatency = baseLatency + jitter;

    await this.sleep(totalLatency);

    // Simulate occasional failures
    const success = Math.random() > 0.02; // 2% error rate

    return { success, responseTime: totalLatency };
  }

  private getRegionLatency(regionId: string): number {
    const latencies: Record<string, number> = {
      'us-east-1': 20,
      'eu-west-1': 45,
      'ap-southeast-1': 80,
      'us-west-2': 35
    };
    return latencies[regionId] || 50;
  }

  private recordMetrics(regionId: string, responseTime: number, success: boolean): void {
    const metric: LoadTestMetrics = {
      region: regionId,
      timestamp: Date.now(),
      responseTime,
      throughput: success ? 1 : 0,
      errorRate: success ? 0 : 1,
      activeUsers: this.getActiveUsers(regionId)
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics per region
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  private getActiveUsers(_regionId: string): number {
    return Math.floor(Math.random() * 1000) + 100;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stopTest(regionId: string): void {
    this.activeTests.set(regionId, false);
  }

  getMetrics(): LoadTestMetrics[] {
    return [...this.metrics];
  }

  getRegionalMetrics(regionId: string): LoadTestMetrics[] {
    return this.metrics.filter(m => m.region === regionId);
  }
}
