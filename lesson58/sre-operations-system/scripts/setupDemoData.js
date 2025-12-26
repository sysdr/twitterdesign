import { Database } from '../src/services/database.js';
import { OnCallService } from '../src/services/onCallService.js';
import { IncidentService } from '../src/services/incidentService.js';

async function setupDemoData() {
  console.log('Setting up demo data...');
  
  try {
    // Initialize database
    await Database.initialize();
    
    // Generate on-call rotation for next 30 days
    console.log('Generating on-call rotation...');
    const schedules = await OnCallService.generateRotation(30);
    console.log(`✓ Generated ${schedules.length} on-call schedules`);
    
    // Activate the current schedule
    const now = new Date();
    await Database.query(
      `UPDATE oncall_schedules 
       SET status = 'active' 
       WHERE start_time <= $1 AND end_time > $1`,
      [now]
    );
    console.log('✓ Activated current on-call schedule');
    
    // Create some sample incidents if none exist
    const { rows: existingIncidents } = await Database.query(
      'SELECT COUNT(*) as count FROM incidents WHERE status IN ($1, $2, $3)',
      ['open', 'acknowledged', 'investigating']
    );
    
    if (parseInt(existingIncidents[0]?.count || '0') === 0) {
      console.log('Creating sample incidents...');
      const sampleIncidents = [
        {
          title: 'Database connection pool exhausted',
          description: 'High number of database connections detected. Current pool usage at 95%.',
          component: 'database',
          affectedUsers: 100
        },
        {
          title: 'API latency spike detected',
          description: 'Response times increased to 2000ms for /api/users endpoint',
          component: 'api',
          affectedUsers: 500
        },
        {
          title: 'Cache miss rate increased',
          description: 'Redis cache hit rate dropped to 65% (normal: 85%)',
          component: 'cache',
          affectedUsers: 250
        }
      ];
      
      for (const incident of sampleIncidents) {
        await IncidentService.createIncident(incident);
      }
      console.log(`✓ Created ${sampleIncidents.length} sample incidents`);
    } else {
      console.log(`✓ Found ${existingIncidents[0].count} existing incidents`);
    }
    
    console.log('✓ Demo data setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to setup demo data:', error);
    process.exit(1);
  }
}

setupDemoData();

