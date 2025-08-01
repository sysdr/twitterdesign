import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from './config/database';

async function runMigrations() {
  console.log('Running database migrations...');
  
  const migrationFiles = [
    '001_users.sql',
    '002_tweets.sql',
    '003_relationships.sql'
  ];
  
  for (const file of migrationFiles) {
    try {
      const sql = readFileSync(join(__dirname, '../../database/schema', file), 'utf8');
      await query(sql);
      console.log(`✅ Migration ${file} completed`);
    } catch (error) {
      console.error(`❌ Migration ${file} failed:`, error);
      throw error;
    }
  }
  
  console.log('All migrations completed successfully!');
}

runMigrations().catch(console.error);
