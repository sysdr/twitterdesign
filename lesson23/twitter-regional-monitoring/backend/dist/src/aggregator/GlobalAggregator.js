"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalAggregator = void 0;
const events_1 = require("events");
class GlobalAggregator extends events_1.EventEmitter {
    metrics = new Map();
    regions = [
        {
            id: 'us-east',
            name: 'US East',
            location: { lat: 40.7128, lng: -74.0060 },
            status: 'healthy'
        },
        {
            id: 'europe',
            name: 'Europe',
            location: { lat: 52.5200, lng: 13.4050 },
            status: 'healthy'
        },
        {
            id: 'asia-pacific',
            name: 'Asia Pacific',
            location: { lat: 35.6762, lng: 139.6503 },
            status: 'healthy'
        }
    ];
    constructor() {
        super();
        this.initializeMetricStorage();
    }
    initializeMetricStorage() {
        this.regions.forEach(region => {
            this.metrics.set(region.id, []);
        });
    }
    addMetrics(metrics) {
        metrics.forEach(metric => {
            const regionMetrics = this.metrics.get(metric.regionId) || [];
            regionMetrics.push(metric);
            // Keep only last 100 metrics per region for memory efficiency
            if (regionMetrics.length > 100) {
                regionMetrics.shift();
            }
            this.metrics.set(metric.regionId, regionMetrics);
        });
        this.updateRegionStatuses();
        this.emitSystemState();
    }
    updateRegionStatuses() {
        this.regions.forEach(region => {
            const regionMetrics = this.metrics.get(region.id) || [];
            const recentMetrics = regionMetrics.slice(-5); // Last 5 metrics
            if (recentMetrics.length === 0) {
                region.status = 'offline';
                return;
            }
            const latencyMetrics = recentMetrics.filter(m => m.type === 'api_latency');
            const errorMetrics = recentMetrics.filter(m => m.type === 'error_rate');
            const avgLatency = latencyMetrics.reduce((sum, m) => sum + m.value, 0) / latencyMetrics.length;
            const avgErrorRate = errorMetrics.reduce((sum, m) => sum + m.value, 0) / errorMetrics.length;
            if (avgLatency > 300 || avgErrorRate > 5) {
                region.status = 'critical';
            }
            else if (avgLatency > 200 || avgErrorRate > 2) {
                region.status = 'degraded';
            }
            else {
                region.status = 'healthy';
            }
        });
    }
    emitSystemState() {
        const criticalRegions = this.regions.filter(r => r.status === 'critical').length;
        const degradedRegions = this.regions.filter(r => r.status === 'degraded').length;
        let globalStatus = 'healthy';
        if (criticalRegions > 0) {
            globalStatus = 'incident';
        }
        else if (degradedRegions > 0) {
            globalStatus = 'degraded';
        }
        const systemState = {
            globalStatus,
            regions: [...this.regions],
            activeAlerts: [],
            metrics: this.getAllRecentMetrics()
        };
        this.emit('systemStateUpdate', systemState);
    }
    getAllRecentMetrics() {
        const allMetrics = [];
        this.metrics.forEach(regionMetrics => {
            allMetrics.push(...regionMetrics.slice(-10)); // Last 10 per region
        });
        return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
    }
    getSystemState() {
        const criticalRegions = this.regions.filter(r => r.status === 'critical').length;
        const degradedRegions = this.regions.filter(r => r.status === 'degraded').length;
        let globalStatus = 'healthy';
        if (criticalRegions > 0) {
            globalStatus = 'incident';
        }
        else if (degradedRegions > 0) {
            globalStatus = 'degraded';
        }
        return {
            globalStatus,
            regions: [...this.regions],
            activeAlerts: [],
            metrics: this.getAllRecentMetrics()
        };
    }
}
exports.GlobalAggregator = GlobalAggregator;
//# sourceMappingURL=GlobalAggregator.js.map