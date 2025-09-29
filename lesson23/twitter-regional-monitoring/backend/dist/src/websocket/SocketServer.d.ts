import { Server } from 'http';
import { SystemState, Alert } from '../../types/monitoring';
export declare class SocketServer {
    private io;
    constructor(server: Server);
    private setupEventHandlers;
    broadcastSystemState(systemState: SystemState): void;
    broadcastNewAlerts(alerts: Alert[]): void;
    broadcastAlertsResolved(alerts: Alert[]): void;
    broadcastAlertAcknowledged(alert: Alert): void;
}
//# sourceMappingURL=SocketServer.d.ts.map