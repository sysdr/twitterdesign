"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidationService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const events_1 = require("events");
class InvalidationService extends events_1.EventEmitter {
    constructor(edgeLocations = ['us-east-1', 'eu-west-1', 'ap-southeast-1']) {
        super();
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        });
        this.subscriber = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        });
        this.edgeLocations = edgeLocations;
        this.setupSubscriptions();
    }
    setupSubscriptions() {
        this.subscriber.subscribe('content:update', 'user:update', 'trending:update');
        this.subscriber.on('message', async (channel, message) => {
            try {
                const data = JSON.parse(message);
                await this.handleInvalidationEvent(channel, data);
            }
            catch (error) {
                console.error('Invalidation subscription error:', error);
            }
        });
    }
    async invalidateContent(contentId, contentType) {
        const event = {
            type: 'content',
            key: `${contentType}:${contentId}`,
            affectedRegions: this.edgeLocations,
            priority: 'high',
            timestamp: Date.now(),
        };
        await this.processInvalidation(event);
    }
    async invalidateUserContent(userId) {
        const patterns = [
            `user:${userId}:*`,
            `timeline:*:${userId}`,
            `profile:${userId}`,
        ];
        for (const pattern of patterns) {
            const event = {
                type: 'user',
                key: pattern,
                affectedRegions: this.edgeLocations,
                priority: 'medium',
                timestamp: Date.now(),
            };
            await this.processInvalidation(event);
        }
    }
    async invalidateTrending() {
        const event = {
            type: 'trending',
            key: 'trending:*',
            affectedRegions: this.edgeLocations,
            priority: 'low',
            timestamp: Date.now(),
        };
        await this.processInvalidation(event);
    }
    async processInvalidation(event) {
        try {
            // Add to invalidation queue with priority
            await this.redis.zadd(`invalidation:queue:${event.priority}`, Date.now(), JSON.stringify(event));
            // Publish to all edge locations
            for (const region of event.affectedRegions) {
                await this.redis.publish(`invalidation:${region}`, JSON.stringify(event));
            }
            // Track invalidation metrics
            await this.redis.hincrby('invalidation:stats', event.type, 1);
            this.emit('invalidation', event);
        }
        catch (error) {
            console.error('Invalidation processing error:', error);
        }
    }
    async handleInvalidationEvent(channel, data) {
        switch (channel) {
            case 'content:update':
                await this.invalidateContent(data.id, data.type);
                break;
            case 'user:update':
                await this.invalidateUserContent(data.userId);
                break;
            case 'trending:update':
                await this.invalidateTrending();
                break;
        }
    }
    async getInvalidationStats() {
        try {
            const stats = await this.redis.hgetall('invalidation:stats');
            const result = {};
            for (const [key, value] of Object.entries(stats)) {
                result[key] = parseInt(value) || 0;
            }
            return result;
        }
        catch (error) {
            console.error('Error getting invalidation stats:', error);
            return {};
        }
    }
}
exports.InvalidationService = InvalidationService;
