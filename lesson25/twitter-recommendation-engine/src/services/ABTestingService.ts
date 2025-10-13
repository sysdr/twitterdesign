import { ExperimentConfig, ExperimentVariant, ABTestResult } from '../types';

export class ABTestingService {
  private experiments: Map<string, ExperimentConfig> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map();
  private results: ABTestResult[] = [];

  /**
   * Create new experiment
   */
  createExperiment(config: ExperimentConfig): void {
    this.experiments.set(config.id, config);
  }

  /**
   * Assign user to experiment variant
   */
  assignUserToVariant(userId: string, experimentId: string): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || !experiment.isActive) {
      return null;
    }

    // Check if user already assigned
    const userExperiments = this.userAssignments.get(userId) || new Map();
    const existingAssignment = userExperiments.get(experimentId);
    if (existingAssignment) {
      return existingAssignment;
    }

    // Check if user should be included in experiment
    const userHash = this.hashUserId(userId);
    if (userHash % 100 >= experiment.trafficPercentage) {
      return null; // User not in experiment
    }

    // Assign to variant based on weighted distribution
    let cumulativeWeight = 0;
    const variantRandom = userHash % 1000 / 1000;

    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (variantRandom < cumulativeWeight) {
        userExperiments.set(experimentId, variant.id);
        this.userAssignments.set(userId, userExperiments);
        return variant.id;
      }
    }

    // Fallback to first variant
    const firstVariant = experiment.variants[0];
    if (firstVariant) {
      userExperiments.set(experimentId, firstVariant.id);
      this.userAssignments.set(userId, userExperiments);
      return firstVariant.id;
    }

    return null;
  }

  /**
   * Track experiment result
   */
  trackResult(result: ABTestResult): void {
    this.results.push(result);
  }

  /**
   * Get experiment results
   */
  getExperimentResults(experimentId: string): Map<string, { count: number; metrics: Record<string, number> }> {
    const experimentResults = this.results.filter(r => r.experimentId === experimentId);
    const variantResults = new Map<string, { count: number; metrics: Record<string, number> }>();

    for (const result of experimentResults) {
      const existing = variantResults.get(result.variantId) || { count: 0, metrics: {} };
      existing.count++;

      for (const [metric, value] of Object.entries(result.metrics)) {
        existing.metrics[metric] = (existing.metrics[metric] || 0) + value;
      }

      variantResults.set(result.variantId, existing);
    }

    // Calculate averages
    for (const [variantId, data] of variantResults.entries()) {
      for (const metric of Object.keys(data.metrics)) {
        data.metrics[metric] = data.metrics[metric] / data.count;
      }
    }

    return variantResults;
  }

  /**
   * Hash user ID for consistent assignment
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Initialize sample experiments
   */
  initializeSampleExperiments(): void {
    this.createExperiment({
      id: 'recommendation-algorithm-v2',
      name: 'Collaborative Filtering vs Content-Based',
      description: 'Compare collaborative filtering with content-based recommendations',
      isActive: true,
      trafficPercentage: 50, // 50% of users in experiment
      variants: [
        {
          id: 'collaborative',
          name: 'Collaborative Filtering',
          weight: 0.5,
          config: { algorithm: 'collaborative', similarUsersCount: 50 }
        },
        {
          id: 'content-based',
          name: 'Content-Based',
          weight: 0.5,
          config: { algorithm: 'content-based', topicsWeight: 0.8 }
        }
      ]
    });

    this.createExperiment({
      id: 'recommendation-count',
      name: 'Timeline Size Optimization',
      description: 'Test different timeline sizes for engagement',
      isActive: true,
      trafficPercentage: 30,
      variants: [
        {
          id: 'small',
          name: '10 Tweets',
          weight: 0.33,
          config: { timelineSize: 10 }
        },
        {
          id: 'medium',
          name: '20 Tweets',
          weight: 0.33,
          config: { timelineSize: 20 }
        },
        {
          id: 'large',
          name: '30 Tweets',
          weight: 0.34,
          config: { timelineSize: 30 }
        }
      ]
    });

    // Add sample A/B test results
    this.generateSampleResults();
  }

  /**
   * Generate sample A/B test results for demonstration
   */
  private generateSampleResults(): void {
    const userIds = Array.from({ length: 100 }, (_, i) => `user-${i}`);
    const experimentId = 'recommendation-algorithm-v2';
    
    // Generate results for collaborative variant
    for (let i = 0; i < 45; i++) {
      const userId = userIds[i];
      this.trackResult({
        experimentId,
        variantId: 'collaborative',
        userId,
        metrics: {
          clicks: Math.floor(Math.random() * 5) + 2,
          likes: Math.floor(Math.random() * 3) + 1,
          retweets: Math.floor(Math.random() * 2),
          replies: Math.floor(Math.random() * 2),
          dwellTime: Math.random() * 20000 + 10000
        }
      });
    }

    // Generate results for content-based variant
    for (let i = 45; i < 90; i++) {
      const userId = userIds[i];
      this.trackResult({
        experimentId,
        variantId: 'content-based',
        userId,
        metrics: {
          clicks: Math.floor(Math.random() * 4) + 1,
          likes: Math.floor(Math.random() * 2) + 1,
          retweets: Math.floor(Math.random() * 1),
          replies: Math.floor(Math.random() * 1),
          dwellTime: Math.random() * 15000 + 8000
        }
      });
    }
  }
}
