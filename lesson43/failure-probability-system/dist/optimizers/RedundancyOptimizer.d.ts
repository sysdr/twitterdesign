import { FailurePrediction } from '../predictors/FailurePredictor';
export interface RedundancyConfig {
    activeInstances: number;
    standbyInstances: number;
    loadBalancingStrategy: 'round-robin' | 'weighted' | 'least-connections';
    circuitBreakerEnabled: boolean;
    trafficAllocation: {
        [key: string]: number;
    };
}
export declare class RedundancyOptimizer {
    private baseInstances;
    private maxInstances;
    optimizeRedundancy(prediction: FailurePrediction): RedundancyConfig;
    private calculateActiveInstances;
    private calculateStandbyInstances;
    private selectLoadBalancingStrategy;
    private allocateTraffic;
    calculateSystemReliability(individualReliability: number, activeInstances: number, architecture: 'series' | 'parallel'): number;
    calculateOptimalRedundancyWithCost(failureProbability: number, costPerInstance: number, failureCost: number): number;
}
