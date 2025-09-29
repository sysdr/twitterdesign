"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertEngine = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class AlertEngine extends events_1.EventEmitter {
    activeAlerts = new Map();
    alertRules = [];
    constructor() {
        super();
        this.initializeAlertRules();
    }
    initializeAlertRules() {
        this.alertRules = [
            {
                id: 'high-latency',
                condition: (metrics) => {
                    const latencyMetrics = metrics.filter(m => m.type === 'api_latency');
                    const avgLatency = latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length;
                    return avgLatency > 200;
                },
                severity: 'warning',
                title: 'High API Latency Detected',
                description: (regionId) => `Region ${regionId} showing elevated API response times`
            },
            {
                id: 'critical-latency',
                condition: (metrics) => {
                    const latencyMetrics = metrics.filter(m => m.type === 'api_latency');
                    const avgLatency = latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length;
                    return avgLatency > 300;
                },
                severity: 'critical',
                title: 'Critical API Latency',
                description: (regionId) => `Region ${regionId} experiencing critical performance degradation`
            },
            {
                id: 'high-error-rate',
                condition: (metrics) => {
                    const errorMetrics = metrics.filter(m => m.type === 'error_rate');
                    const avgErrorRate = errorMetrics.reduce((sum, m) => sum + m.value, 0) / errorMetrics.length;
                    return avgErrorRate > 3;
                },
                severity: 'critical',
                title: 'Elevated Error Rate',
                description: (regionId) => `Region ${regionId} showing increased error rates`
            }
        ];
    }
    evaluateSystemState(systemState) {
        const newAlerts = [];
        // Evaluate per-region alerts
        systemState.regions.forEach(region => {
            const regionMetrics = systemState.metrics.filter(m => m.regionId === region.id).slice(-5);
            this.alertRules.forEach(rule => {
                if (rule.condition(regionMetrics)) {
                    const existingAlert = Array.from(this.activeAlerts.values())
                        .find(alert => alert.regionId === region.id && alert.title === rule.title);
                    if (!existingAlert) {
                        const alert = {
                            id: (0, uuid_1.v4)(),
                            timestamp: Date.now(),
                            severity: rule.severity,
                            title: rule.title,
                            description: rule.description(region.name),
                            regionId: region.id,
                            correlatedAlerts: [],
                            resolved: false
                        };
                        this.activeAlerts.set(alert.id, alert);
                        newAlerts.push(alert);
                    }
                }
            });
        });
        // Perform alert correlation
        this.correlateAlerts();
        // Emit new alerts
        if (newAlerts.length > 0) {
            this.emit('newAlerts', newAlerts);
        }
        // Auto-resolve alerts for healthy regions
        this.autoResolveAlerts(systemState);
    }
    correlateAlerts() {
        const alerts = Array.from(this.activeAlerts.values()).filter(a => !a.resolved);
        // Group alerts by type and time proximity
        const alertGroups = new Map();
        alerts.forEach(alert => {
            const key = `${alert.title}-${Math.floor(alert.timestamp / 60000)}`; // Group by minute
            if (!alertGroups.has(key)) {
                alertGroups.set(key, []);
            }
            alertGroups.get(key).push(alert);
        });
        // Correlate alerts in the same group
        alertGroups.forEach(group => {
            if (group.length > 1) {
                group.forEach(alert => {
                    alert.correlatedAlerts = group.filter(a => a.id !== alert.id).map(a => a.id);
                });
            }
        });
    }
    autoResolveAlerts(systemState) {
        const resolvedAlerts = [];
        this.activeAlerts.forEach((alert, alertId) => {
            if (alert.resolved)
                return;
            const region = systemState.regions.find(r => r.id === alert.regionId);
            if (region && region.status === 'healthy') {
                alert.resolved = true;
                resolvedAlerts.push(alert);
            }
        });
        if (resolvedAlerts.length > 0) {
            this.emit('alertsResolved', resolvedAlerts);
        }
    }
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values()).filter(a => !a.resolved);
    }
    acknowledgeAlert(alertId, userId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.acknowledgedBy = userId;
            this.emit('alertAcknowledged', alert);
            return true;
        }
        return false;
    }
}
exports.AlertEngine = AlertEngine;
//# sourceMappingURL=AlertEngine.js.map