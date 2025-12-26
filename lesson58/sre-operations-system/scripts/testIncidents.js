import { IncidentService } from '../src/services/incidentService.js';
import { RedisCache } from '../src/services/redisClient.js';

const testIncidentData = [
  {
    title: 'Database connection pool exhausted',
    description: 'High number of database connections detected',
    component: 'database',
    affectedUsers: 100,
    severity: 1
  },
  {
    title: 'API latency spike detected',
    description: 'Response times increased to 2000ms',
    component: 'api',
    affectedUsers: 500,
    severity: 3
  },
  {
    title: 'Critical: Service completely down',
    description: 'Main service unreachable',
    component: 'service',
    affectedUsers: 5000,
    severity: 5
  }
];

async function testIncidents() {
  console.log('Testing incident management system...');
  
  // Connect to Redis
  try {
    await RedisCache.connect();
  } catch (error) {
    console.warn('Redis not available, continuing without cache...');
  }
  
  for (const incident of testIncidentData) {
    const created = await IncidentService.createIncident(incident);
    console.log(`✓ Created incident: ${created.title} (Severity: ${created.severity})`);
    
    if (created.runbookExecuted) {
      console.log(`  ✓ Auto-resolved with runbook: ${created.runbookExecuted}`);
    } else {
      console.log(`  → Escalated to level ${created.escalationLevel}`);
    }
  }
  
  const metrics = await IncidentService.getIncidentMetrics();
  console.log(`✓ Incident metrics: ${JSON.stringify(metrics, null, 2)}`);
  
  console.log('✓ All incident tests passed!');
  process.exit(0);
}

testIncidents().catch((error) => {
  console.error('Incident test failed:', error);
  process.exit(1);
});
