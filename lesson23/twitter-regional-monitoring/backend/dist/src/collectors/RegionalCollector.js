"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegionalCollector = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class RegionalCollector extends events_1.EventEmitter {
    regionId;
    collectionInterval = null;
    simulationVariance;
    constructor(regionId) {
        super();
        this.regionId = regionId;
        this.simulationVariance = Math.random() * 0.3 + 0.85; // Simulate regional performance differences
    }
    startCollection() {
        this.collectionInterval = setInterval(() => {
            this.collectMetrics();
        }, 5000); // Collect every 5 seconds
        console.log(`🔍 Started metric collection for region: ${this.regionId}`);
    }
    stopCollection() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
    }
    collectMetrics() {
        const timestamp = Date.now();
        const baseLatency = 100 * this.simulationVariance;
        const metrics = [
            {
                id: (0, uuid_1.v4)(),
                regionId: this.regionId,
                timestamp,
                type: 'api_latency',
                value: baseLatency + (Math.random() * 50),
                unit: 'ms'
            },
            {
                id: (0, uuid_1.v4)(),
                regionId: this.regionId,
                timestamp,
                type: 'error_rate',
                value: (Math.random() * 2) * (2 - this.simulationVariance),
                unit: '%'
            },
            {
                id: (0, uuid_1.v4)(),
                regionId: this.regionId,
                timestamp,
                type: 'cpu_usage',
                value: 40 + (Math.random() * 30) * (2 - this.simulationVariance),
                unit: '%'
            },
            {
                id: (0, uuid_1.v4)(),
                regionId: this.regionId,
                timestamp,
                type: 'memory_usage',
                value: 60 + (Math.random() * 25),
                unit: '%'
            },
            {
                id: (0, uuid_1.v4)(),
                regionId: this.regionId,
                timestamp,
                type: 'db_connections',
                value: Math.floor(150 + (Math.random() * 100)),
                unit: 'count'
            },
            {
                id: (0, uuid_1.v4)(),
                regionId: this.regionId,
                timestamp,
                type: 'cache_hit_rate',
                value: 85 + (Math.random() * 10) * this.simulationVariance,
                unit: '%'
            }
        ];
        this.emit('metrics', metrics);
    }
    // Simulate regional issues for testing
    simulateIssue(severity) {
        if (severity === 'major') {
            this.simulationVariance = 0.3; // Significant degradation
        }
        else {
            this.simulationVariance = 0.7; // Minor degradation
        }
    }
    resetToNormal() {
        this.simulationVariance = Math.random() * 0.3 + 0.85;
    }
}
exports.RegionalCollector = RegionalCollector;
//# sourceMappingURL=RegionalCollector.js.map