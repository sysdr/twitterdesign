import { EventEmitter } from 'events';
import { Alert, SystemState } from '../../types/monitoring';
export declare class AlertEngine extends EventEmitter {
    private activeAlerts;
    private alertRules;
    constructor();
    private initializeAlertRules;
    evaluateSystemState(systemState: SystemState): void;
    private correlateAlerts;
    private autoResolveAlerts;
    getActiveAlerts(): Alert[];
    acknowledgeAlert(alertId: string, userId: string): boolean;
}
//# sourceMappingURL=AlertEngine.d.ts.map