export declare class FailureProbabilitySystem {
    private collector;
    private analyzer;
    private predictor;
    private optimizer;
    private wsServer;
    private predictionHistory;
    constructor();
    start(port?: number): Promise<void>;
    private performAnalysisAndPredict;
    private broadcastUpdate;
}
