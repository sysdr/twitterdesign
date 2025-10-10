import { RecommendationRequest, RecommendationResponse, UserInteraction } from '../types';
import { CollaborativeFilteringService } from './CollaborativeFilteringService';
import { ABTestingService } from './ABTestingService';

export class RecommendationService {
  private collaborativeFiltering: CollaborativeFilteringService;
  private abTesting: ABTestingService;

  constructor() {
    this.collaborativeFiltering = new CollaborativeFilteringService();
    this.abTesting = new ABTestingService();
    
    // Initialize with sample data
    this.collaborativeFiltering.initializeSampleData();
    this.abTesting.initializeSampleExperiments();
  }

  /**
   * Get personalized recommendations for user
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    // Check A/B test assignment for recommendation algorithm
    const algorithmVariant = this.abTesting.assignUserToVariant(
      request.userId, 
      'recommendation-algorithm-v2'
    );

    // Check A/B test assignment for timeline size
    const sizeVariant = this.abTesting.assignUserToVariant(
      request.userId, 
      'recommendation-count'
    );

    // Adjust request based on A/B test
    const adjustedRequest = { ...request };
    if (sizeVariant) {
      const sizeConfig = sizeVariant === 'small' ? 10 : sizeVariant === 'medium' ? 20 : 30;
      adjustedRequest.limit = Math.min(adjustedRequest.limit, sizeConfig);
    }

    // Generate recommendations based on assigned algorithm
    const recommendations = await this.collaborativeFiltering.generateRecommendations(adjustedRequest);

    // Add A/B test metadata
    if (recommendations.debugInfo) {
      recommendations.debugInfo = {
        ...recommendations.debugInfo,
        algorithmVersion: algorithmVariant || 'control',
        sizeVariant: sizeVariant || 'control'
      };
    }

    return recommendations;
  }

  /**
   * Track user interaction
   */
  trackInteraction(interaction: UserInteraction): void {
    // Update collaborative filtering model
    this.collaborativeFiltering.updateUserEmbedding(interaction.userId, interaction);

    // Track A/B test metrics
    const experimentIds = ['recommendation-algorithm-v2', 'recommendation-count'];
    
    for (const experimentId of experimentIds) {
      const variantId = this.abTesting.assignUserToVariant(interaction.userId, experimentId);
      if (variantId) {
        // Calculate engagement metrics
        const metrics: Record<string, number> = {
          clicks: interaction.type === 'click' ? 1 : 0,
          likes: interaction.type === 'like' ? 1 : 0,
          retweets: interaction.type === 'retweet' ? 1 : 0,
          replies: interaction.type === 'reply' ? 1 : 0,
          dwellTime: interaction.dwellTime || 0
        };

        this.abTesting.trackResult({
          experimentId,
          variantId,
          userId: interaction.userId,
          metrics
        });
      }
    }
  }

  /**
   * Get A/B test results
   */
  getExperimentResults(experimentId: string) {
    return this.abTesting.getExperimentResults(experimentId);
  }
}
