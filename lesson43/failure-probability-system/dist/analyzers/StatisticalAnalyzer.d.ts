import { SystemMetrics } from '../collectors/MetricsCollector';
export interface DistributionParams {
    type: 'exponential' | 'weibull' | 'lognormal';
    lambda?: number;
    beta?: number;
    eta?: number;
    mu?: number;
    sigma?: number;
    aic: number;
}
export interface FailureRateAnalysis {
    currentFailureRate: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    confidence: number;
    distribution: DistributionParams;
}
export declare class StatisticalAnalyzer {
    fitExponentialDistribution(metrics: SystemMetrics[]): DistributionParams;
    fitWeibullDistribution(metrics: SystemMetrics[]): DistributionParams;
    analyzeFailureRate(metrics: SystemMetrics[]): FailureRateAnalysis;
    private calculateTrend;
}
