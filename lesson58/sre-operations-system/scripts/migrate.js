import { Database } from '../src/services/database.js';

async function migrate() {
  console.log('Running database migrations...');
  await Database.initialize();
  console.log('Migrations complete!');
  process.exit(0);
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
