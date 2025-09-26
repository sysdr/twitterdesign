"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeCacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const crypto_1 = __importDefault(require("crypto"));
class EdgeCacheService {
    constructor(edgeLocation = 'us-east-1') {
        this.redis = new ioredis_1.default({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            maxRetriesPerRequest: 3,
        });
        this.edgeLocation = edgeLocation;
        this.stats = {
            hitRate: 0,
            totalRequests: 0,
            totalHits: 0,
            avgResponseTime: 0,
        };
    }
    async get(key) {
        const startTime = Date.now();
        this.stats.totalRequests++;
        try {
            const cached = await this.redis.get(`edge:${this.edgeLocation}:${key}`);
            if (cached) {
                const entry = JSON.parse(cached);
                // Check TTL
                if (Date.now() - entry.timestamp < entry.ttl * 1000) {
                    entry.hitCount++;
                    this.stats.totalHits++;
                    this.updateStats(Date.now() - startTime);
                    // Update hit count
                    await this.redis.set(`edge:${this.edgeLocation}:${key}`, JSON.stringify(entry), 'EX', Math.floor((entry.ttl * 1000 - (Date.now() - entry.timestamp)) / 1000));
                    return entry;
                }
                else {
                    // Expired, remove from cache
                    await this.redis.del(`edge:${this.edgeLocation}:${key}`);
                }
            }
            this.updateStats(Date.now() - startTime);
            return null;
        }
        catch (error) {
            console.error('Cache get error:', error);
            this.updateStats(Date.now() - startTime);
            return null;
        }
    }
    async set(key, content, ttl = 300, contentType = 'application/json') {
        try {
            const etag = crypto_1.default.createHash('md5').update(JSON.stringify(content)).digest('hex');
            const entry = {
                content,
                etag,
                timestamp: Date.now(),
                ttl,
                hitCount: 0,
                contentType,
            };
            await this.redis.set(`edge:${this.edgeLocation}:${key}`, JSON.stringify(entry), 'EX', ttl);
            // Track cache warming
            await this.redis.zadd('cache:warming', Date.now(), key);
        }
        catch (error) {
            console.error('Cache set error:', error);
        }
    }
    async invalidate(key) {
        try {
            await this.redis.del(`edge:${this.edgeLocation}:${key}`);
            await this.redis.publish('cache:invalidation', JSON.stringify({
                key,
                edgeLocation: this.edgeLocation,
                timestamp: Date.now(),
            }));
        }
        catch (error) {
            console.error('Cache invalidation error:', error);
        }
    }
    async bulkInvalidate(pattern) {
        try {
            const keys = await this.redis.keys(`edge:${this.edgeLocation}:${pattern}`);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            console.error('Bulk invalidation error:', error);
        }
    }
    getStats() {
        this.stats.hitRate = this.stats.totalRequests > 0
            ? (this.stats.totalHits / this.stats.totalRequests) * 100
            : 0;
        return { ...this.stats };
    }
    updateStats(responseTime) {
        this.stats.avgResponseTime =
            (this.stats.avgResponseTime * (this.stats.totalRequests - 1) + responseTime)
                / this.stats.totalRequests;
    }
}
exports.EdgeCacheService = EdgeCacheService;
