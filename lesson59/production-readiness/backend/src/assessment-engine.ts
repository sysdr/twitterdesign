import { AssessmentResult, CategoryScore, ValidationResult } from './types';
import { ArchitectureValidator } from './validators/architecture-validator';
import { PerformanceValidator } from './validators/performance-validator';
import { SecurityValidator } from './validators/security-validator';
import { DisasterRecoveryValidator } from './validators/disaster-recovery-validator';
import { OperationsValidator } from './validators/operations-validator';

export class AssessmentEngine {
  private categoryWeights: Record<string, number> = {
    'Security': 0.25,
    'Disaster Recovery': 0.20,
    'Performance': 0.20,
    'Operations': 0.15,
    'Architecture': 0.15,
    'Monitoring': 0.05
  };

  async runAssessment(): Promise<AssessmentResult> {
    const startTime = new Date();
    console.log('Starting production readiness assessment...');

    const allResults: ValidationResult[] = [];

    // Run all validators
    console.log('Running Architecture validation...');
    const archValidator = new ArchitectureValidator();
    const archResults = await archValidator.validate();
    allResults.push(...archResults);

    console.log('Running Performance validation...');
    const perfValidator = new PerformanceValidator();
    const perfResults = await perfValidator.validate();
    allResults.push(...perfResults);

    console.log('Running Security validation...');
    const secValidator = new SecurityValidator();
    const secResults = await secValidator.validate();
    allResults.push(...secResults);

    console.log('Running Disaster Recovery validation...');
    const drValidator = new DisasterRecoveryValidator();
    const drResults = await drValidator.validate();
    allResults.push(...drResults);

    console.log('Running Operations validation...');
    const opsValidator = new OperationsValidator();
    const opsResults = await opsValidator.validate();
    allResults.push(...opsResults);

    const endTime = new Date();

    // Calculate category scores
    const categoryScores = this.calculateCategoryScores(allResults);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(categoryScores);

    // Determine status
    const status = this.determineStatus(overallScore, categoryScores);

    const result: AssessmentResult = {
      id: this.generateId(),
      overallScore,
      status,
      categoryScores,
      checks: allResults,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime()
    };

    console.log(`Assessment completed: ${status.toUpperCase()} (Score: ${overallScore.toFixed(1)})`);

    return result;
  }

  private calculateCategoryScores(results: ValidationResult[]): CategoryScore[] {
    const categories = new Map<string, ValidationResult[]>();

    // Group results by category
    results.forEach(result => {
      const checkId = result.checkId;
      const category = this.getCategoryFromCheckId(checkId);
      
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(result);
    });

    // Calculate scores for each category
    const categoryScores: CategoryScore[] = [];

    categories.forEach((categoryResults, category) => {
      const totalScore = categoryResults.reduce((sum, r) => sum + r.score, 0);
      const avgScore = totalScore / categoryResults.length;
      const checksPassed = categoryResults.filter(r => r.passed).length;
      
      const weight = this.categoryWeights[category] || 0.1;
      
      let status: 'pass' | 'warning' | 'fail' = 'pass';
      if (avgScore < 70) {
        status = 'fail';
      } else if (avgScore < 90) {
        status = 'warning';
      }

      categoryScores.push({
        category,
        score: avgScore,
        weight,
        status,
        checksCompleted: categoryResults.length,
        checksPassed
      });
    });

    return categoryScores;
  }

  private calculateOverallScore(categoryScores: CategoryScore[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    categoryScores.forEach(cs => {
      weightedSum += cs.score * cs.weight;
      totalWeight += cs.weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private determineStatus(
    overallScore: number,
    categoryScores: CategoryScore[]
  ): 'ready' | 'needs-attention' | 'not-ready' {
    // Check for any critical failures
    const hasCriticalFailures = categoryScores.some(
      cs => cs.status === 'fail' && ['Security', 'Disaster Recovery'].includes(cs.category)
    );

    if (hasCriticalFailures) {
      return 'not-ready';
    }

    if (overallScore >= 90) {
      return 'ready';
    } else if (overallScore >= 70) {
      return 'needs-attention';
    } else {
      return 'not-ready';
    }
  }

  private getCategoryFromCheckId(checkId: string): string {
    const prefix = checkId.split('-')[0];
    const categoryMap: Record<string, string> = {
      'arch': 'Architecture',
      'perf': 'Performance',
      'sec': 'Security',
      'dr': 'Disaster Recovery',
      'ops': 'Operations'
    };
    return categoryMap[prefix] || 'Other';
  }

  private generateId(): string {
    return `assessment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
