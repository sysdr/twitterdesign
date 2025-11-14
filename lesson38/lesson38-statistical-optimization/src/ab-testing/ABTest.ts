import { v4 as uuidv4 } from 'uuid';

export interface ABTestConfig {
  name: string;
  controlConfig: any;
  experimentConfig: any;
  trafficPercentage: number;
  maxDuration: number; // hours
  metrics: string[];
}

export interface ABTestResult {
  metric: string;
  controlMean: number;
  experimentMean: number;
  pValue: number;
  effectSize: number;
  confidenceInterval: [number, number];
  significant: boolean;
}

export interface MetricDataPoint {
  timestamp: number;
  value: number;
  group: 'control' | 'experiment';
}

export class ABTest {
  id: string;
  config: ABTestConfig;
  startTime: number;
  status: 'running' | 'stopped' | 'concluded';
  metrics: Map<string, MetricDataPoint[]>;
  results: ABTestResult[] = [];

  constructor(config: ABTestConfig) {
    this.id = uuidv4();
    this.config = config;
    this.startTime = Date.now();
    this.status = 'running';
    this.metrics = new Map();
    
    config.metrics.forEach(metric => {
      this.metrics.set(metric, []);
    });
  }

  recordMetric(metric: string, value: number, group: 'control' | 'experiment'): void {
    if (!this.metrics.has(metric)) {
      return;
    }

    this.metrics.get(metric)!.push({
      timestamp: Date.now(),
      value,
      group
    });

    // Check if we should analyze results
    this.maybeAnalyze();
  }

  private maybeAnalyze(): void {
    if (this.status !== 'running') {
      return;
    }

    const elapsed = (Date.now() - this.startTime) / (1000 * 60 * 60); // hours
    const minDataPoints = 100;
    const hasEnoughData = Array.from(this.metrics.values()).every(
      points => points.filter(p => p.group === 'control').length >= minDataPoints &&
                points.filter(p => p.group === 'experiment').length >= minDataPoints
    );

    if (!hasEnoughData) {
      return;
    }

    // Analyze every 5 minutes
    const lastAnalysis = this.results.length > 0 ? this.results[0].pValue : 0;
    if (lastAnalysis > 0 && elapsed < 0.083) { // 5 minutes
      return;
    }

    this.analyze();

    // Stop if conclusive or max duration reached
    const conclusive = this.results.some(r => r.significant && Math.abs(r.effectSize) > 0.2);
    if (conclusive || elapsed > this.config.maxDuration) {
      this.status = 'concluded';
    }
  }

  private analyze(): void {
    this.results = [];

    this.config.metrics.forEach(metric => {
      const dataPoints = this.metrics.get(metric)!;
      const controlPoints = dataPoints.filter(p => p.group === 'control').map(p => p.value);
      const experimentPoints = dataPoints.filter(p => p.group === 'experiment').map(p => p.value);

      if (controlPoints.length < 30 || experimentPoints.length < 30) {
        return;
      }

      const result = this.mannWhitneyUTest(controlPoints, experimentPoints, metric);
      this.results.push(result);
    });
  }

  private mannWhitneyUTest(
    control: number[],
    experiment: number[],
    metric: string
  ): ABTestResult {
    const n1 = control.length;
    const n2 = experiment.length;

    // Combine and rank
    const combined = [
      ...control.map(v => ({ value: v, group: 'control' as const })),
      ...experiment.map(v => ({ value: v, group: 'experiment' as const }))
    ].sort((a, b) => a.value - b.value);

    let R1 = 0; // sum of ranks for control
    for (let i = 0; i < combined.length; i++) {
      if (combined[i].group === 'control') {
        R1 += i + 1;
      }
    }

    // Calculate U statistic
    const U1 = R1 - (n1 * (n1 + 1)) / 2;
    const U2 = n1 * n2 - U1;
    const U = Math.min(U1, U2);

    // Calculate z-score for normal approximation
    const meanU = (n1 * n2) / 2;
    const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
    const z = (U - meanU) / stdU;

    // Two-tailed p-value
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

    // Calculate means
    const controlMean = control.reduce((a, b) => a + b, 0) / n1;
    const experimentMean = experiment.reduce((a, b) => a + b, 0) / n2;

    // Cohen's d effect size
    const pooledStd = Math.sqrt(
      ((n1 - 1) * this.variance(control) + (n2 - 1) * this.variance(experiment)) / (n1 + n2 - 2)
    );
    const effectSize = (experimentMean - controlMean) / pooledStd;

    // 95% confidence interval for difference
    const seDiff = pooledStd * Math.sqrt(1 / n1 + 1 / n2);
    const diff = experimentMean - controlMean;
    const confidenceInterval: [number, number] = [
      diff - 1.96 * seDiff,
      diff + 1.96 * seDiff
    ];

    return {
      metric,
      controlMean,
      experimentMean,
      pValue,
      effectSize,
      confidenceInterval,
      significant: pValue < 0.01 // Stricter threshold for infrastructure
    };
  }

  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }

  private variance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  }

  getResults(): ABTestResult[] {
    return this.results;
  }

  getStatus(): string {
    return this.status;
  }
}
