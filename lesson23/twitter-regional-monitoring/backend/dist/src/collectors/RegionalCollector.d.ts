import { EventEmitter } from 'events';
export declare class RegionalCollector extends EventEmitter {
    private regionId;
    private collectionInterval;
    private simulationVariance;
    constructor(regionId: string);
    startCollection(): void;
    stopCollection(): void;
    private collectMetrics;
    simulateIssue(severity: 'minor' | 'major'): void;
    resetToNormal(): void;
}
//# sourceMappingURL=RegionalCollector.d.ts.map