/**
 * Working Set Theory Implementation
 * Analyzes access patterns to determine optimal cache size
 * Based on Peter Denning's working set model
 */

export interface WorkingSetConfig {
  windowSize: number;  // Time window in milliseconds
  sampleInterval: number;
}

export class WorkingSetAnalyzer {
  private accessLog: Map<string, number[]>;  // key -> timestamps
  private config: WorkingSetConfig;
  private workingSetSizes: number[];
  private maxWorkingSetSize: number;

  constructor(config: WorkingSetConfig) {
    this.accessLog = new Map();
    this.config = config;
    this.workingSetSizes = [];
    this.maxWorkingSetSize = 0;
  }

  /**
   * Record an access
   */
  recordAccess(key: string): void {
    const now = Date.now();
    
    if (!this.accessLog.has(key)) {
      this.accessLog.set(key, []);
    }
    
    this.accessLog.get(key)!.push(now);
    this.cleanOldAccesses();
  }

  /**
   * Remove accesses outside the window
   */
  private cleanOldAccesses(): void {
    const cutoff = Date.now() - this.config.windowSize;
    
    for (const [key, timestamps] of this.accessLog.entries()) {
      const filtered = timestamps.filter(t => t > cutoff);
      
      if (filtered.length === 0) {
        this.accessLog.delete(key);
      } else {
        this.accessLog.set(key, filtered);
      }
    }
  }

  /**
   * Calculate current working set size
   */
  calculateWorkingSetSize(): number {
    this.cleanOldAccesses();
    const size = this.accessLog.size;
    
    this.workingSetSizes.push(size);
    if (this.workingSetSizes.length > 100) {
      this.workingSetSizes.shift();
    }
    
    this.maxWorkingSetSize = Math.max(this.maxWorkingSetSize, size);
    return size;
  }

  /**
   * Get recommended cache size based on working set
   * Returns size that covers 95th percentile of working set sizes
   */
  getRecommendedCacheSize(): number {
    if (this.workingSetSizes.length === 0) {
      return 1000;  // Default
    }

    const sorted = [...this.workingSetSizes].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    return sorted[p95Index];
  }

  /**
   * Get statistics
   */
  getStats() {
    const current = this.calculateWorkingSetSize();
    const average = this.workingSetSizes.length > 0
      ? this.workingSetSizes.reduce((a, b) => a + b, 0) / this.workingSetSizes.length
      : 0;

    return {
      currentWorkingSetSize: current,
      averageWorkingSetSize: Math.round(average),
      maxWorkingSetSize: this.maxWorkingSetSize,
      recommendedCacheSize: this.getRecommendedCacheSize(),
      samples: this.workingSetSizes.length
    };
  }
}

