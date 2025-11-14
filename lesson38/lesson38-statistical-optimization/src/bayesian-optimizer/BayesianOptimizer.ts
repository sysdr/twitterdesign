import { GaussianProcess } from './GaussianProcess';

export interface Parameter {
  name: string;
  min: number;
  max: number;
  type: 'continuous' | 'discrete';
  step?: number;
}

export interface Configuration {
  [key: string]: number;
}

export interface OptimizationResult {
  configuration: Configuration;
  expectedImprovement: number;
  explorationRatio: number;
}

export class BayesianOptimizer {
  private gp: GaussianProcess;
  private parameters: Parameter[];
  private bestObservedValue: number = -Infinity;
  private trialCount: number = 0;

  constructor(parameters: Parameter[]) {
    this.gp = new GaussianProcess();
    this.parameters = parameters;
  }

  addObservation(config: Configuration, performance: number): void {
    const x = this.parametersToVector(config);
    this.gp.addObservation(x, performance);
    
    if (performance > this.bestObservedValue) {
      this.bestObservedValue = performance;
    }
    
    this.trialCount++;
  }

  private parametersToVector(config: Configuration): number[] {
    return this.parameters.map(p => {
      const value = config[p.name];
      // Normalize to [0, 1]
      return (value - p.min) / (p.max - p.min);
    });
  }

  private vectorToParameters(x: number[]): Configuration {
    const config: Configuration = {};
    this.parameters.forEach((p, idx) => {
      let value = p.min + x[idx] * (p.max - p.min);
      
      if (p.type === 'discrete' && p.step) {
        value = Math.round(value / p.step) * p.step;
      }
      
      config[p.name] = Math.max(p.min, Math.min(p.max, value));
    });
    return config;
  }

  private expectedImprovement(x: number[]): number {
    const prediction = this.gp.predict(x);
    
    if (prediction.variance === 0) {
      return 0;
    }
    
    const sigma = Math.sqrt(prediction.variance);
    const z = (prediction.mean - this.bestObservedValue) / sigma;
    
    // Expected Improvement formula
    const phi = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
    const Phi = 0.5 * (1 + this.erf(z / Math.sqrt(2)));
    
    const ei = sigma * (z * Phi + phi);
    
    // Add exploration bonus early in optimization
    const explorationWeight = Math.exp(-this.trialCount / 20);
    const explorationBonus = explorationWeight * sigma;
    
    return ei + explorationBonus;
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

  suggestNext(numCandidates: number = 1000): OptimizationResult {
    let bestEI = -Infinity;
    let bestConfig: Configuration | null = null;
    let bestVector: number[] = [];

    // Random search over candidate points
    for (let i = 0; i < numCandidates; i++) {
      const x = this.parameters.map(() => Math.random());
      const ei = this.expectedImprovement(x);
      
      if (ei > bestEI) {
        bestEI = ei;
        bestConfig = this.vectorToParameters(x);
        bestVector = x;
      }
    }

    // Calculate exploration ratio
    const explorationRatio = Math.exp(-this.trialCount / 20);

    return {
      configuration: bestConfig!,
      expectedImprovement: bestEI,
      explorationRatio
    };
  }

  getBestConfiguration(): { configuration: Configuration; performance: number } | null {
    const observations = this.gp.getObservations();
    
    if (observations.length === 0) {
      return null;
    }

    let best = observations[0];
    for (const obs of observations) {
      if (obs.y > best.y) {
        best = obs;
      }
    }

    return {
      configuration: this.vectorToParameters(best.x),
      performance: best.y
    };
  }

  getTrialCount(): number {
    return this.trialCount;
  }
}
