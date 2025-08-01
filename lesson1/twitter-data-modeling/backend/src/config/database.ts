import { Pool, PoolConfig } from 'pg';

const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'twitter_db',
  user: process.env.DB_USER || 'twitter_user',
  password: process.env.DB_PASSWORD || 'twitter_pass',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(dbConfig);

export const query = (text: string, params?: any[]) => {
  const start = Date.now();
  return pool.query(text, params).then(res => {
    const duration = Date.now() - start;
    console.log('Query executed', { text, duration, rows: res.rowCount });
    return res;
  });
};
