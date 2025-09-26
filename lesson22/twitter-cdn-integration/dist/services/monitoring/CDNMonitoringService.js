"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CDNMonitoringService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const events_1 = require("events");
class CDNMonitoringService extends events_1.EventEmitter {
    constructor(edgeLocations = ['us-east-1', 'eu-west-1', 'ap-southeast-1']) {
        super();
        this.metricsInterval = null;
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        });
        this.edgeLocations = edgeLocations;
        this.startMetricsCollection();
    }
    startMetricsCollection() {
        this.metricsInterval = setInterval(async () => {
            await this.collectMetrics();
        }, 30000); // Collect every 30 seconds
    }
    async collectMetrics() {
        try {
            const edgeMetrics = [];
            for (const location of this.edgeLocations) {
                const metrics = await this.getEdgeMetrics(location);
                edgeMetrics.push(metrics);
            }
            const globalMetrics = {
                totalHitRate: this.calculateGlobalHitRate(edgeMetrics),
                totalRequests: edgeMetrics.reduce((sum, m) => sum + m.totalRequests, 0),
                totalBandwidth: edgeMetrics.reduce((sum, m) => sum + m.bandwidthUsage, 0),
                edgeMetrics,
                lastUpdated: Date.now(),
            };
            await this.storeGlobalMetrics(globalMetrics);
            this.emit('metrics', globalMetrics);
        }
        catch (error) {
            console.error('Metrics collection error:', error);
        }
    }
    async getEdgeMetrics(edgeLocation) {
        try {
            const stats = await this.redis.hmget(`edge:stats:${edgeLocation}`, 'hitRate', 'totalRequests', 'avgResponseTime', 'bandwidthUsage', 'errorRate');
            return {
                edgeLocation,
                hitRate: parseFloat(stats[0] || '0'),
                totalRequests: parseInt(stats[1] || '0'),
                avgResponseTime: parseFloat(stats[2] || '0'),
                bandwidthUsage: parseFloat(stats[3] || '0'),
                errorRate: parseFloat(stats[4] || '0'),
                timestamp: Date.now(),
            };
        }
        catch (error) {
            console.error(`Error getting metrics for ${edgeLocation}:`, error);
            return {
                edgeLocation,
                hitRate: 0,
                totalRequests: 0,
                avgResponseTime: 0,
                bandwidthUsage: 0,
                errorRate: 0,
                timestamp: Date.now(),
            };
        }
    }
    calculateGlobalHitRate(edgeMetrics) {
        const totalRequests = edgeMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
        const totalHits = edgeMetrics.reduce((sum, m) => sum + (m.totalRequests * m.hitRate / 100), 0);
        return totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
    }
    async storeGlobalMetrics(metrics) {
        try {
            await this.redis.set('cdn:global:metrics', JSON.stringify(metrics), 'EX', 300 // 5 minutes TTL
            );
            // Store historical data
            await this.redis.zadd('cdn:metrics:history', Date.now(), JSON.stringify(metrics));
            // Keep only last 24 hours of history
            await this.redis.zremrangebyscore('cdn:metrics:history', 0, Date.now() - (24 * 60 * 60 * 1000));
        }
        catch (error) {
            console.error('Error storing global metrics:', error);
        }
    }
    async getGlobalMetrics() {
        try {
            const metrics = await this.redis.get('cdn:global:metrics');
            return metrics ? JSON.parse(metrics) : null;
        }
        catch (error) {
            console.error('Error getting global metrics:', error);
            return null;
        }
    }
    async getMetricsHistory(hours = 24) {
        try {
            const cutoff = Date.now() - (hours * 60 * 60 * 1000);
            const history = await this.redis.zrangebyscore('cdn:metrics:history', cutoff, '+inf');
            return history.map(item => JSON.parse(item));
        }
        catch (error) {
            console.error('Error getting metrics history:', error);
            return [];
        }
    }
    destroy() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        this.redis.disconnect();
    }
}
exports.CDNMonitoringService = CDNMonitoringService;
