import { Database } from '../src/services/database.js';

const engineers = [
  { id: 'eng-1', name: 'Alice Chen', email: 'alice@example.com', timezone: 'America/Los_Angeles', expertiseAreas: ['database', 'cache'] },
  { id: 'eng-2', name: 'Bob Kumar', email: 'bob@example.com', timezone: 'America/New_York', expertiseAreas: ['api', 'microservices'] },
  { id: 'eng-3', name: 'Carol Martinez', email: 'carol@example.com', timezone: 'Europe/London', expertiseAreas: ['infrastructure', 'networking'] },
  { id: 'eng-4', name: 'David Park', email: 'david@example.com', timezone: 'Asia/Tokyo', expertiseAreas: ['frontend', 'performance'] },
  { id: 'eng-5', name: 'Emma Wilson', email: 'emma@example.com', timezone: 'Australia/Sydney', expertiseAreas: ['security', 'compliance'] },
  { id: 'eng-6', name: 'Frank Zhang', email: 'frank@example.com', timezone: 'America/Chicago', expertiseAreas: ['data', 'analytics'] }
];

async function seed() {
  console.log('Seeding engineers...');
  
  for (const eng of engineers) {
    await Database.query(
      `INSERT INTO engineers (id, name, email, timezone, expertise_areas, recent_incidents, hours_since_rotation, satisfaction_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [eng.id, eng.name, eng.email, eng.timezone, eng.expertiseAreas, 
       Math.floor(Math.random() * 10), Math.floor(Math.random() * 200), 
       7.0 + Math.random() * 2]
    );
  }
  
  console.log(`Seeded ${engineers.length} engineers`);
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
