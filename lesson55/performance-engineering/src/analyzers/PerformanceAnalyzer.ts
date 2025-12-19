import { Metric, MetricsCollector } from '../collectors/MetricsCollector';

export interface PerformanceBudget {
  endpoint: string;
  p50: number;
  p95: number;
  p99: number;
}

export interface RegressionResult {
  metric: string;
  baseline: number[];
  current: number[];
  pValue: number;
  effectSize: number;
  isRegression: boolean;
  percentageChange: number;
}

export interface BottleneckAnalysis {
  component: string;
  latency: number;
  percentage: number;
  suggestions: string[];
}

export class PerformanceAnalyzer {
  private budgets: Map<string, PerformanceBudget> = new Map();
  private baselines: Map<string, number[]> = new Map();
  private collector: MetricsCollector;

  constructor(collector: MetricsCollector) {
    this.collector = collector;
    this.loadDefaultBudgets();
  }

  private loadDefaultBudgets(): void {
    const defaultBudgets: PerformanceBudget[] = [
      { endpoint: 'api.tweet.create', p50: 30, p95: 50, p99: 75 },
      { endpoint: 'api.timeline.fetch', p50: 20, p95: 30, p99: 50 },
      { endpoint: 'db.query.user', p50: 5, p95: 10, p99: 20 },
      { endpoint: 'cache.operation', p50: 2, p95: 5, p99: 10 }
    ];

    defaultBudgets.forEach(budget => {
      this.budgets.set(budget.endpoint, budget);
    });
  }

  checkBudgetCompliance(endpoint: string, metrics: number[]): {
    compliant: boolean;
    violations: string[];
    percentiles: any;
  } {
    const budget = this.budgets.get(endpoint);
    if (!budget) {
      return { compliant: true, violations: [], percentiles: {} };
    }

    const percentiles = this.collector.calculatePercentiles(metrics);
    const violations: string[] = [];

    if (percentiles.p50 > budget.p50) {
      violations.push(`P50 exceeds budget: ${percentiles.p50}ms > ${budget.p50}ms`);
    }
    if (percentiles.p95 > budget.p95) {
      violations.push(`P95 exceeds budget: ${percentiles.p95}ms > ${budget.p95}ms`);
    }
    if (percentiles.p99 > budget.p99) {
      violations.push(`P99 exceeds budget: ${percentiles.p99}ms > ${budget.p99}ms`);
    }

    return {
      compliant: violations.length === 0,
      violations,
      percentiles
    };
  }

  detectRegression(metric: string, currentValues: number[]): RegressionResult {
    const baseline = this.baselines.get(metric) || [];
    
    if (baseline.length < 30) {
      // Need more baseline data
      return {
        metric,
        baseline,
        current: currentValues,
        pValue: 1,
        effectSize: 0,
        isRegression: false,
        percentageChange: 0
      };
    }

    // Mann-Whitney U test
    const pValue = this.mannWhitneyU(baseline, currentValues);
    
    // Cohen's d effect size
    const effectSize = this.cohensD(baseline, currentValues);
    
    // Percentage change
    const baselineMean = this.mean(baseline);
    const currentMean = this.mean(currentValues);
    const percentageChange = ((currentMean - baselineMean) / baselineMean) * 100;

    const isRegression = pValue < 0.05 && effectSize > 0.2 && percentageChange > 1;

    return {
      metric,
      baseline,
      current: currentValues,
      pValue,
      effectSize,
      isRegression,
      percentageChange
    };
  }

  updateBaseline(metric: string, values: number[]): void {
    const existing = this.baselines.get(metric) || [];
    const combined = [...existing, ...values];
    
    // Keep last 1000 values
    if (combined.length > 1000) {
      this.baselines.set(metric, combined.slice(-1000));
    } else {
      this.baselines.set(metric, combined);
    }
  }

  analyzeBottlenecks(metrics: Metric[]): BottleneckAnalysis[] {
    // Group metrics by component
    const componentMetrics = new Map<string, number[]>();
    
    metrics.forEach(metric => {
      const component = metric.name.split('.')[0];
      if (!componentMetrics.has(component)) {
        componentMetrics.set(component, []);
      }
      componentMetrics.get(component)!.push(metric.value);
    });

    // Calculate average latency per component
    const bottlenecks: BottleneckAnalysis[] = [];
    let totalLatency = 0;

    componentMetrics.forEach((values, component) => {
      const avg = this.mean(values);
      totalLatency += avg;
    });

    componentMetrics.forEach((values, component) => {
      const avg = this.mean(values);
      const percentage = (avg / totalLatency) * 100;
      
      const suggestions = this.generateOptimizationSuggestions(component, avg, values);
      
      bottlenecks.push({
        component,
        latency: avg,
        percentage,
        suggestions
      });
    });

    return bottlenecks.sort((a, b) => b.latency - a.latency);
  }

  private generateOptimizationSuggestions(component: string, avgLatency: number, values: number[]): string[] {
    const suggestions: string[] = [];
    const variance = this.variance(values);
    const p99 = this.percentile(values, 0.99);

    if (component === 'db') {
      if (avgLatency > 20) {
        suggestions.push('Add database index for frequently queried fields');
        suggestions.push('Consider query result caching');
      }
      if (variance > 100) {
        suggestions.push('High query variance detected - investigate slow queries');
      }
    } else if (component === 'cache') {
      if (avgLatency > 5) {
        suggestions.push('Cache operation slow - check cache server capacity');
      }
      suggestions.push('Review cache hit rate and TTL configuration');
    } else if (component === 'api') {
      if (p99 > 100) {
        suggestions.push('High P99 latency - implement timeout and circuit breakers');
      }
      if (variance > 500) {
        suggestions.push('Investigate external API latency variance');
      }
    }

    return suggestions;
  }

  private mannWhitneyU(sample1: number[], sample2: number[]): number {
    // Simplified Mann-Whitney U test
    const n1 = sample1.length;
    const n2 = sample2.length;
    
    const combined = [...sample1.map(v => ({ value: v, group: 1 })),
                      ...sample2.map(v => ({ value: v, group: 2 }))];
    combined.sort((a, b) => a.value - b.value);
    
    let r1 = 0;
    combined.forEach((item, index) => {
      if (item.group === 1) {
        r1 += (index + 1);
      }
    });
    
    const u1 = r1 - (n1 * (n1 + 1)) / 2;
    const u2 = n1 * n2 - u1;
    const u = Math.min(u1, u2);
    
    // Approximate p-value
    const meanU = (n1 * n2) / 2;
    const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
    const z = (u - meanU) / stdU;
    
    // Convert to p-value (simplified)
    return Math.abs(z) > 1.96 ? 0.01 : 0.5;
  }

  private cohensD(sample1: number[], sample2: number[]): number {
    const mean1 = this.mean(sample1);
    const mean2 = this.mean(sample2);
    const pooledStd = Math.sqrt((this.variance(sample1) + this.variance(sample2)) / 2);
    
    return Math.abs(mean1 - mean2) / pooledStd;
  }

  private mean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private variance(values: number[]): number {
    const avg = this.mean(values);
    const squareDiffs = values.map(val => Math.pow(val - avg, 2));
    return this.mean(squareDiffs);
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * p);
    return sorted[index] || 0;
  }
}
