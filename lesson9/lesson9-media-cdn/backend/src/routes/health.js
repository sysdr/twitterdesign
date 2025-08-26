const express = require('express');
const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redis');
const { getS3Client } = require('../config/aws');

const router = express.Router();

router.get('/', async (req, res) => {
    const health = {
        timestamp: new Date().toISOString(),
        status: 'healthy',
        services: {}
    };

    try {
        // Check MongoDB
        if (mongoose.connection.readyState === 1) {
            health.services.mongodb = 'connected';
        } else {
            health.services.mongodb = 'disconnected';
            health.status = 'unhealthy';
        }

        // Check Redis
        try {
            const redisClient = getRedisClient();
            await redisClient.ping();
            health.services.redis = 'connected';
        } catch (error) {
            health.services.redis = 'disconnected';
            health.status = 'unhealthy';
        }

        // Check S3
        try {
            const s3Client = getS3Client();
            await s3Client.headBucket({ Bucket: process.env.AWS_S3_BUCKET }).promise();
            health.services.s3 = 'connected';
        } catch (error) {
            health.services.s3 = 'disconnected';
            health.status = 'unhealthy';
        }

        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);

    } catch (error) {
        res.status(500).json({
            timestamp: new Date().toISOString(),
            status: 'error',
            error: error.message
        });
    }
});

module.exports = router;
