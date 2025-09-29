import { EventEmitter } from 'events';
import { Metric, SystemState } from '../../types/monitoring';
export declare class GlobalAggregator extends EventEmitter {
    private metrics;
    private regions;
    constructor();
    private initializeMetricStorage;
    addMetrics(metrics: Metric[]): void;
    private updateRegionStatuses;
    private emitSystemState;
    private getAllRecentMetrics;
    getSystemState(): SystemState;
}
//# sourceMappingURL=GlobalAggregator.d.ts.map