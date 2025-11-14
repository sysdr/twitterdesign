import { ABTest, ABTestConfig } from './ABTest';

export class ABTestController {
  private activeTests: Map<string, ABTest> = new Map();
  private completedTests: ABTest[] = [];
  private maxConcurrentTests: number = 2;

  canStartNewTest(): boolean {
    return this.activeTests.size < this.maxConcurrentTests;
  }

  startTest(config: ABTestConfig): string {
    if (!this.canStartNewTest()) {
      throw new Error(`Maximum ${this.maxConcurrentTests} concurrent tests allowed`);
    }

    const test = new ABTest(config);
    this.activeTests.set(test.id, test);
    
    console.log(`Started A/B test: ${config.name} (ID: ${test.id})`);
    return test.id;
  }

  recordMetric(testId: string, metric: string, value: number, group: 'control' | 'experiment'): void {
    const test = this.activeTests.get(testId);
    if (!test) {
      return;
    }

    test.recordMetric(metric, value, group);

    // Check if test concluded
    if (test.getStatus() === 'concluded') {
      this.activeTests.delete(testId);
      this.completedTests.push(test);
      console.log(`A/B test concluded: ${test.config.name}`);
      console.log('Results:', JSON.stringify(test.getResults(), null, 2));
    }
  }

  getActiveTests(): ABTest[] {
    return Array.from(this.activeTests.values());
  }

  getCompletedTests(): ABTest[] {
    return this.completedTests;
  }

  getTest(testId: string): ABTest | undefined {
    return this.activeTests.get(testId) || this.completedTests.find(t => t.id === testId);
  }
}
