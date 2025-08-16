const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'config.env') });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://twitter_user:twitter_pass@localhost:5432/twitter_auth';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.PORT = '3001';
process.env.CORS_ORIGIN = 'http://localhost:3000';

// Debug logging
console.log('Test environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);

