import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'twitter_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'twitter_search',
  password: process.env.DB_PASSWORD || 'twitter_password',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
