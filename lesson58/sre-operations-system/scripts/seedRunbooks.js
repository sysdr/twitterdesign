import { Database } from '../src/services/database.js';

const runbooks = [
  {
    id: 'rb-1',
    name: 'Database Connection Pool Scale',
    description: 'Automatically scales database connection pool when exhausted',
    trigger_pattern: 'database',
    steps: JSON.stringify([
      { id: '1', action: 'Check current pool size', expectedResult: 'Pool size retrieved', timeout: 5000 },
      { id: '2', action: 'Scale pool by 20%', expectedResult: 'Pool scaled', timeout: 10000 },
      { id: '3', action: 'Verify connections healthy', expectedResult: 'All connections healthy', timeout: 5000 }
    ]),
    success_criteria: ['Pool scaled successfully', 'No connection errors'],
    execution_count: 12,
    success_rate: 95.5,
    avg_execution_time: 8200
  },
  {
    id: 'rb-2',
    name: 'Cache Warming',
    description: 'Pre-warms cache for frequently accessed data',
    trigger_pattern: 'cache',
    steps: JSON.stringify([
      { id: '1', action: 'Identify cold cache keys', expectedResult: 'Keys identified', timeout: 3000 },
      { id: '2', action: 'Fetch data from database', expectedResult: 'Data fetched', timeout: 5000 },
      { id: '3', action: 'Populate cache', expectedResult: 'Cache populated', timeout: 5000 }
    ]),
    success_criteria: ['Cache hit rate > 80%', 'Latency reduced'],
    execution_count: 45,
    success_rate: 98.2,
    avg_execution_time: 6500
  },
  {
    id: 'rb-3',
    name: 'Pod Restart',
    description: 'Gracefully restarts unhealthy pods',
    trigger_pattern: 'service',
    steps: JSON.stringify([
      { id: '1', action: 'Identify unhealthy pods', expectedResult: 'Pods identified', timeout: 5000 },
      { id: '2', action: 'Drain connections', expectedResult: 'Connections drained', timeout: 30000 },
      { id: '3', action: 'Restart pods', expectedResult: 'Pods restarted', timeout: 60000 }
    ]),
    success_criteria: ['All pods healthy', 'Zero downtime'],
    execution_count: 8,
    success_rate: 87.5,
    avg_execution_time: 95000
  }
];

async function seed() {
  for (const rb of runbooks) {
    await Database.query(
      `INSERT INTO runbooks (id, name, description, trigger_pattern, steps, success_criteria, execution_count, success_rate, avg_execution_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING`,
      [rb.id, rb.name, rb.description, rb.trigger_pattern, rb.steps, rb.success_criteria, rb.execution_count, rb.success_rate, rb.avg_execution_time]
    );
  }
  
  console.log(`Seeded ${runbooks.length} runbooks`);
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});


