import * as math from 'mathjs';

interface DataPoint {
  x: number[];
  y: number;
}

export class GaussianProcess {
  private data: DataPoint[] = [];
  private lengthScale: number = 1.0;
  private signalVariance: number = 1.0;
  private noiseVariance: number = 0.1;

  addObservation(x: number[], y: number): void {
    this.data.push({ x, y });
  }

  private kernelRBF(x1: number[], x2: number[]): number {
    const diff = x1.map((val, idx) => val - x2[idx]);
    const sqDist = diff.reduce((sum, d) => sum + d * d, 0);
    return this.signalVariance * Math.exp(-sqDist / (2 * this.lengthScale * this.lengthScale));
  }

  predict(xNew: number[]): { mean: number; variance: number } {
    if (this.data.length === 0) {
      return { mean: 0, variance: this.signalVariance };
    }

    const n = this.data.length;
    const KArray: number[][] = [];
    
    // Build kernel matrix
    for (let i = 0; i < n; i++) {
      KArray[i] = [];
      for (let j = 0; j < n; j++) {
        KArray[i][j] = this.kernelRBF(this.data[i].x, this.data[j].x);
      }
      // Add noise to diagonal
      KArray[i][i] += this.noiseVariance;
    }
    
    const K = math.matrix(KArray);

    // Compute k_star (correlation between new point and training points)
    const kStar = this.data.map(d => this.kernelRBF(xNew, d.x));
    
    // Compute k_star_star (kernel of new point with itself)
    const kStarStar = this.kernelRBF(xNew, xNew);

    // Get observed values
    const y = math.matrix(this.data.map(d => d.y));
    
    try {
      // Solve for alpha = K^{-1} * y
      const alpha = math.lusolve(K, y) as math.Matrix;
      
      // Mean prediction: k_star^T * alpha
      const mean = kStar.reduce((sum, k, i) => sum + k * alpha.get([i, 0]), 0);
      
      // Variance prediction: k_star_star - k_star^T * K^{-1} * k_star
      const KInvKStar = math.lusolve(K, math.matrix(kStar.map(k => [k]))) as math.Matrix;
      const variance = kStarStar - kStar.reduce((sum, k, i) => 
        sum + k * KInvKStar.get([i, 0]), 0
      );
      
      return { mean, variance: Math.max(0, variance) };
    } catch (error) {
      // Fallback if matrix is singular
      const values = this.data.map(d => d.y);
      const meanVal = Number(math.mean(values));
      const varianceVal = Number(math.variance(values));
      return { mean: meanVal, variance: varianceVal };
    }
  }

  getObservations(): DataPoint[] {
    return [...this.data];
  }
}
