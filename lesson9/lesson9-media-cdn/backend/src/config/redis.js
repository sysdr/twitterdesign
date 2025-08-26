const redis = require('redis');

let redisClient;

const connectRedis = async () => {
    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL
        });

        redisClient.on('error', (err) => {
            console.error('❌ Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis Connected');
        });

        await redisClient.connect();
    } catch (error) {
        console.error('❌ Redis connection error:', error);
    }
};

const getRedisClient = () => redisClient;

module.exports = { connectRedis, getRedisClient };
