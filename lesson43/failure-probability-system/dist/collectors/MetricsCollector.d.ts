export interface SystemMetrics {
    timestamp: number;
    cpuUsage: number;
    memoryUsage: number;
    memoryGrowthRate: number;
    errorRate: number;
    responseTime: number;
    responseTimeVariance: number;
    queueDepth: number;
    activeConnections: number;
    diskIOWait: number;
    networkLatency: number;
}
export declare class MetricsCollector {
    private collectionInterval;
    private metrics;
    private baseMemory;
    private simulatedLoad;
    private errorCount;
    private requestCount;
    constructor(collectionInterval?: number);
    startCollection(onMetric: (metric: SystemMetrics) => void): void;
    simulateLoad(load: number): void;
    injectError(): void;
    private collectMetric;
    private calculateVariance;
    getRecentMetrics(count?: number): SystemMetrics[];
    getAllMetrics(): SystemMetrics[];
}
