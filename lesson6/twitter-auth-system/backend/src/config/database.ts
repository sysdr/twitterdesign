import { Pool } from 'pg';
import { createClient } from 'redis';
import { config } from './config.js';

console.log('Database URL:', config.database.url);
console.log('Redis URL:', config.redis.url);

const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const redis = createClient({
  url: config.redis.url
});

redis.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  await redis.connect();
  console.log('Connected to Redis');
};

export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL');
    
    // Test a simple query
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Database query successful: ${result.rows[0].count} users found`);
    
    client.release();
    console.log('✅ Database connection test completed successfully');
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err);
    console.error('Connection details:', {
      host: 'localhost',
      port: 5432,
      database: 'twitter_auth',
      user: 'twitter_user'
    });
    throw err;
  }
};

export { pool, redis };
