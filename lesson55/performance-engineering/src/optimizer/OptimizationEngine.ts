import { BottleneckAnalysis } from '../analyzers/PerformanceAnalyzer';

export interface Optimization {
  id: string;
  type: 'query' | 'cache' | 'connection_pool' | 'algorithm';
  description: string;
  estimatedImprovement: number; // percentage
  confidence: number; // 0-1
  implementationSteps: string[];
  automaticApply: boolean;
}

export class OptimizationEngine {
  private appliedOptimizations: Set<string> = new Set();

  generateOptimizations(bottlenecks: BottleneckAnalysis[]): Optimization[] {
    const optimizations: Optimization[] = [];

    bottlenecks.forEach((bottleneck, index) => {
      if (bottleneck.component === 'db') {
        optimizations.push({
          id: `db-opt-${index}`,
          type: 'query',
          description: `Add composite index on frequently queried fields (${bottleneck.latency.toFixed(2)}ms impact)`,
          estimatedImprovement: 40,
          confidence: 0.85,
          implementationSteps: [
            'Analyze slow query log for common patterns',
            'Create composite index on (user_id, created_at)',
            'Rebuild table statistics',
            'Verify query plan uses new index'
          ],
          automaticApply: false
        });

        if (bottleneck.latency > 50) {
          optimizations.push({
            id: `db-pool-${index}`,
            type: 'connection_pool',
            description: 'Increase database connection pool size',
            estimatedImprovement: 25,
            confidence: 0.75,
            implementationSteps: [
              'Monitor connection pool utilization',
              'Increase pool size from 20 to 40',
              'Monitor for improvement in wait time',
              'Adjust based on database server capacity'
            ],
            automaticApply: true
          });
        }
      }

      if (bottleneck.component === 'cache') {
        optimizations.push({
          id: `cache-opt-${index}`,
          type: 'cache',
          description: 'Adjust cache TTL based on access patterns',
          estimatedImprovement: 30,
          confidence: 0.80,
          implementationSteps: [
            'Analyze cache hit/miss rates per key pattern',
            'Increase TTL for frequently accessed keys',
            'Implement cache warming for predictable patterns',
            'Monitor hit rate improvement'
          ],
          automaticApply: true
        });
      }

      if (bottleneck.component === 'api' && bottleneck.latency > 100) {
        optimizations.push({
          id: `api-opt-${index}`,
          type: 'algorithm',
          description: 'Implement request batching to reduce API calls',
          estimatedImprovement: 45,
          confidence: 0.90,
          implementationSteps: [
            'Identify repeated API calls in request path',
            'Implement request batching with 50ms window',
            'Add result caching for batch responses',
            'Monitor latency reduction'
          ],
          automaticApply: false
        });
      }
    });

    return this.prioritizeOptimizations(optimizations);
  }

  private prioritizeOptimizations(optimizations: Optimization[]): Optimization[] {
    // Sort by potential impact (improvement * confidence)
    return optimizations.sort((a, b) => {
      const scoreA = a.estimatedImprovement * a.confidence;
      const scoreB = b.estimatedImprovement * b.confidence;
      return scoreB - scoreA;
    });
  }

  applyOptimization(optimization: Optimization): boolean {
    if (this.appliedOptimizations.has(optimization.id)) {
      console.log(`Optimization ${optimization.id} already applied`);
      return false;
    }

    console.log(`Applying optimization: ${optimization.description}`);
    console.log(`Estimated improvement: ${optimization.estimatedImprovement}%`);
    console.log(`Confidence: ${(optimization.confidence * 100).toFixed(1)}%`);

    if (optimization.automaticApply) {
      console.log('Automatically applying optimization...');
      optimization.implementationSteps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`);
      });
      this.appliedOptimizations.add(optimization.id);
      return true;
    } else {
      console.log('Manual approval required for this optimization');
      console.log('Implementation steps:');
      optimization.implementationSteps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step}`);
      });
      return false;
    }
  }

  getAppliedOptimizations(): string[] {
    return Array.from(this.appliedOptimizations);
  }
}
