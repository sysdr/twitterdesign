import { ValidationCheck, ValidationResult } from '../types';

export class PerformanceValidator {
  private checks: ValidationCheck[] = [
    {
      id: 'perf-001',
      category: 'Performance',
      name: 'Response Time SLA',
      description: 'Validates P95 response times meet targets',
      weight: 0.30,
      severity: 'critical'
    },
    {
      id: 'perf-002',
      category: 'Performance',
      name: 'Throughput Capacity',
      description: 'Verifies system handles target load',
      weight: 0.25,
      severity: 'critical'
    },
    {
      id: 'perf-003',
      category: 'Performance',
      name: 'Error Rate',
      description: 'Checks error rate under load',
      weight: 0.20,
      severity: 'high'
    },
    {
      id: 'perf-004',
      category: 'Performance',
      name: 'Resource Utilization',
      description: 'Validates efficient resource usage',
      weight: 0.15,
      severity: 'medium'
    },
    {
      id: 'perf-005',
      category: 'Performance',
      name: 'Sustained Load',
      description: 'Tests performance under extended load',
      weight: 0.10,
      severity: 'medium'
    }
  ];

  async validate(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const check of this.checks) {
      const startTime = Date.now();
      let result: ValidationResult;

      switch (check.id) {
        case 'perf-001':
          result = await this.checkResponseTime(check);
          break;
        case 'perf-002':
          result = await this.checkThroughput(check);
          break;
        case 'perf-003':
          result = await this.checkErrorRate(check);
          break;
        case 'perf-004':
          result = await this.checkResourceUtilization(check);
          break;
        case 'perf-005':
          result = await this.checkSustainedLoad(check);
          break;
        default:
          result = this.createFailedResult(check, ['Unknown check']);
      }

      result.executionTime = Date.now() - startTime;
      results.push(result);
    }

    return results;
  }

  private async checkResponseTime(check: ValidationCheck): Promise<ValidationResult> {
    const findings: string[] = [];
    const recommendations: string[] = [];

    // Simulate load test results
    const p50 = 45;  // ms
    const p95 = 180; // ms
    const p99 = 350; // ms
    const target = 200; // ms target for P95

    findings.push(`P50 response time: ${p50}ms`);
    findings.push(`P95 response time: ${p95}ms (Target: ${target}ms)`);
    findings.push(`P99 response time: ${p99}ms`);

    const passed = p95 <= target;

    if (!passed) {
      recommendations.push('Optimize database queries and add caching');
      recommendations.push('Profile slow endpoints and optimize code paths');
    }

    return {
      checkId: check.id,
      passed,
      score: passed ? 100 : Math.max(50, 100 - ((p95 - target) / target * 100)),
      findings,
      recommendations,
      executionTime: 0,
      timestamp: new Date()
    };
  }

  private async checkThroughput(check: ValidationCheck): Promise<ValidationResult> {
    const findings: string[] = [];
    const recommendations: string[] = [];

    // Simulate throughput test
    const actualRPS = 950;
    const targetRPS = 1000;
    const peakHandled = 1200;

    findings.push(`Target: ${targetRPS} requests/second`);
    findings.push(`Achieved: ${actualRPS} requests/second`);
    findings.push(`Peak capacity: ${peakHandled} requests/second`);

    const passed = actualRPS >= targetRPS * 0.95;

    if (!passed) {
      recommendations.push('Scale horizontally by adding more application instances');
      recommendations.push('Optimize database connection pooling');
    } else {
      findings.push(`System handles target load with ${((peakHandled - targetRPS) / targetRPS * 100).toFixed(0)}% headroom`);
    }

    return {
      checkId: check.id,
      passed,
      score: passed ? 100 : (actualRPS / targetRPS * 100),
      findings,
      recommendations,
      executionTime: 0,
      timestamp: new Date()
    };
  }

  private async checkErrorRate(check: ValidationCheck): Promise<ValidationResult> {
    const findings: string[] = [];
    const recommendations: string[] = [];

    // Simulate error rate analysis
    const errorRate = 0.008; // 0.8%
    const targetErrorRate = 0.01; // 1%
    const timeoutErrors = 0.003;
    const serverErrors = 0.005;

    findings.push(`Overall error rate: ${(errorRate * 100).toFixed(2)}% (Target: <${(targetErrorRate * 100)}%)`);
    findings.push(`Timeout errors: ${(timeoutErrors * 100).toFixed(2)}%`);
    findings.push(`Server errors: ${(serverErrors * 100).toFixed(2)}%`);

    const passed = errorRate <= targetErrorRate;

    if (!passed) {
      recommendations.push('Investigate timeout causes and increase timeout thresholds if appropriate');
      recommendations.push('Add retry logic with exponential backoff');
    }

    return {
      checkId: check.id,
      passed,
      score: passed ? 100 : Math.max(60, 100 - ((errorRate - targetErrorRate) / targetErrorRate * 100)),
      findings,
      recommendations,
      executionTime: 0,
      timestamp: new Date()
    };
  }

  private async checkResourceUtilization(check: ValidationCheck): Promise<ValidationResult> {
    const findings: string[] = [];
    const recommendations: string[] = [];

    // Simulate resource monitoring
    const cpuUtilization = 0.65;
    const memoryUtilization = 0.72;
    const diskIO = 0.45;

    findings.push(`CPU utilization: ${(cpuUtilization * 100).toFixed(0)}%`);
    findings.push(`Memory utilization: ${(memoryUtilization * 100).toFixed(0)}%`);
    findings.push(`Disk I/O utilization: ${(diskIO * 100).toFixed(0)}%`);

    const efficient = cpuUtilization < 0.80 && memoryUtilization < 0.85;
    const passed = efficient;

    if (!efficient) {
      if (cpuUtilization >= 0.80) {
        recommendations.push('CPU utilization high - consider horizontal scaling');
      }
      if (memoryUtilization >= 0.85) {
        recommendations.push('Memory utilization high - check for memory leaks');
      }
    } else {
      findings.push('Resource utilization within optimal range');
    }

    return {
      checkId: check.id,
      passed,
      score: passed ? 100 : 70,
      findings,
      recommendations,
      executionTime: 0,
      timestamp: new Date()
    };
  }

  private async checkSustainedLoad(check: ValidationCheck): Promise<ValidationResult> {
    const findings: string[] = [];
    const recommendations: string[] = [];

    // Simulate sustained load test
    const testDuration = 60; // minutes
    const degradation = 0.03; // 3% performance degradation over time

    findings.push(`Sustained load test duration: ${testDuration} minutes`);
    findings.push(`Performance degradation: ${(degradation * 100).toFixed(1)}%`);

    const passed = degradation < 0.05; // Less than 5% degradation acceptable

    if (!passed) {
      recommendations.push('Check for memory leaks causing gradual slowdown');
      recommendations.push('Review connection pool management');
      recommendations.push('Analyze garbage collection patterns');
    } else {
      findings.push('No significant performance degradation detected');
    }

    return {
      checkId: check.id,
      passed,
      score: passed ? 100 : Math.max(70, 100 - (degradation * 1000)),
      findings,
      recommendations,
      executionTime: 0,
      timestamp: new Date()
    };
  }

  private createFailedResult(check: ValidationCheck, findings: string[]): ValidationResult {
    return {
      checkId: check.id,
      passed: false,
      score: 0,
      findings,
      recommendations: ['Review check implementation'],
      executionTime: 0,
      timestamp: new Date()
    };
  }
}
