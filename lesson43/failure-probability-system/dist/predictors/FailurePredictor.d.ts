import { SystemMetrics } from '../collectors/MetricsCollector';
import { FailureRateAnalysis, DistributionParams } from '../analyzers/StatisticalAnalyzer';
export interface FailurePrediction {
    probability1Hour: number;
    probability6Hour: number;
    probability24Hour: number;
    timeToFailure: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    confidence: number;
}
export declare class FailurePredictor {
    calculateSurvivalProbability(distribution: DistributionParams, currentAge: number, futureTime: number): number;
    predict(metrics: SystemMetrics[], analysis: FailureRateAnalysis): FailurePrediction;
    private adjustProbabilityWithCurrentState;
    private estimateTimeToFailure;
    private determineRiskLevel;
    private generateRecommendations;
    private getDefaultPrediction;
}
