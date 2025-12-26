import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { Database } from './services/database';
import { RedisCache } from './services/redisClient';
import { OnCallService } from './services/onCallService';
import { IncidentService } from './services/incidentService';
import { RunbookService } from './services/runbookService';
import { TeamHealthService } from './services/teamHealthService';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected from:', req.socket.remoteAddress);
  
  ws.on('message', (message) => {
    try {
      console.log('Received:', message.toString());
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', (code, reason) => {
    console.log('WebSocket client disconnected:', code, reason.toString());
  });

  // Send a welcome message
  ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connection established' }));
});

// Broadcast to all connected clients
function broadcast(data: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// Subscribe to Redis events and broadcast (setup in start function)

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.get('/api/oncall/current', async (_req, res) => {
  try {
    const engineer = await OnCallService.getCurrentOnCall();
    res.json(engineer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/oncall/upcoming', async (_req, res) => {
  try {
    const rotations = await OnCallService.getUpcomingRotations(10);
    res.json(rotations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/oncall/generate', async (req, res) => {
  try {
    const { days } = req.body;
    const schedules = await OnCallService.generateRotation(days || 30);
    res.json({ success: true, count: schedules.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/incidents/active', async (_req, res) => {
  try {
    const incidents = await IncidentService.getActiveIncidents();
    res.json(incidents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/incidents', async (req, res) => {
  try {
    const incident = await IncidentService.createIncident(req.body);
    res.json(incident);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/incidents/:id/acknowledge', async (req, res) => {
  try {
    const { engineerId } = req.body;
    await IncidentService.acknowledgeIncident(req.params.id, engineerId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/incidents/:id/resolve', async (req, res) => {
  try {
    const { notes } = req.body;
    await IncidentService.resolveIncident(req.params.id, notes);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/incidents/metrics', async (_req, res) => {
  try {
    const metrics = await IncidentService.getIncidentMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/runbooks', async (_req, res) => {
  try {
    const runbooks = await RunbookService.getAllRunbooks();
    res.json(runbooks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/team/health', async (_req, res) => {
  try {
    const metrics = await TeamHealthService.calculateMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/team/health/trends', async (_req, res) => {
  try {
    // Get current average satisfaction score
    const { rows: satisfactionRows } = await Database.query(
      'SELECT AVG(satisfaction_score) as avg FROM engineers'
    );
    const avgSatisfaction = parseFloat(satisfactionRows[0]?.avg || '7.5');

    // Get weekly incident counts for the last 4 weeks
    // Use a more reliable week calculation
    const { rows } = await Database.query(`
      SELECT 
        DATE_TRUNC('week', created_at)::date as week_start,
        COUNT(*)::integer as incidents
      FROM incidents
      WHERE created_at >= NOW() - INTERVAL '28 days'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY week_start ASC
    `);

    // Create trend data for the last 4 weeks
    const trends = [];
    const now = new Date();
    
    // Create a map of week_start to incident count
    const weekDataMap = new Map();
    rows.forEach((row: any) => {
      const weekKey = new Date(row.week_start).toISOString().split('T')[0];
      weekDataMap.set(weekKey, parseInt(row.incidents || '0', 10));
    });

    // Generate data for the last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      // Set to Monday of that week
      const dayOfWeek = weekStart.getDay();
      const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      weekStart.setDate(diff);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      const incidents = weekDataMap.get(weekKey) || 0;
      
      trends.push({
        week: `W${4 - i}`,
        incidents: incidents,
        satisfaction: avgSatisfaction
      });
    }

    res.json(trends);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/setup/demo', async (_req, res) => {
  try {
    // Generate on-call rotation for next 30 days
    const schedules = await OnCallService.generateRotation(30);
    
    // Activate the current schedule
    const now = new Date();
    await Database.query(
      `UPDATE oncall_schedules 
       SET status = 'active' 
       WHERE start_time <= $1 AND end_time > $1 AND status = 'scheduled'`,
      [now]
    );
    
    // Always create fresh sample incidents for demo
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
      },
      {
        title: 'High CPU usage on production servers',
        description: 'CPU usage spiked to 95% on multiple production instances',
        component: 'infrastructure',
        affectedUsers: 1000
      }
    ];
    
    // Get current on-call engineer
    const currentOnCall = await OnCallService.getCurrentOnCall();
    const engineerId = currentOnCall?.id || null;
    
    let incidentsCreated = 0;
    const createdIncidentIds: string[] = [];
    
    for (const incident of sampleIncidents) {
      try {
        const createdIncident = await IncidentService.createIncident(incident);
        createdIncidentIds.push(createdIncident.id);
        incidentsCreated++;
      } catch (error) {
        console.error('Failed to create incident:', error);
      }
    }
    
    // Acknowledge and resolve some incidents to generate realistic metrics
    // Acknowledge first 3 incidents with realistic acknowledgment times (30-180 seconds)
    // Resolve first 1-2 of those acknowledged incidents with realistic resolve times (5-30 minutes after acknowledgment)
    if (engineerId && createdIncidentIds.length > 0) {
      const incidentsToAcknowledge = createdIncidentIds.slice(0, Math.min(3, createdIncidentIds.length));
      const acknowledgedIncidentIds: string[] = [];
      
      // First, acknowledge incidents
      for (let i = 0; i < incidentsToAcknowledge.length; i++) {
        const incidentId = incidentsToAcknowledge[i];
        try {
          // Set acknowledged_at to a few seconds after created_at (simulating realistic response time)
          const ackDelaySeconds = Math.round(30 + Math.random() * 150); // 30-180 seconds
          // Get the incident's created_at first
          const { rows: incidentRows } = await Database.query(
            `SELECT created_at FROM incidents WHERE id = $1`,
            [incidentId]
          );
          if (incidentRows.length > 0) {
            const createdAt = new Date(incidentRows[0].created_at);
            const acknowledgedAt = new Date(createdAt.getTime() + ackDelaySeconds * 1000);
            await Database.query(
              `UPDATE incidents 
               SET status = 'acknowledged', acknowledged_at = $1, assigned_to = $2
               WHERE id = $3`,
              [acknowledgedAt, engineerId, incidentId]
            );
            acknowledgedIncidentIds.push(incidentId);
          }
        } catch (error) {
          console.error('Failed to acknowledge incident:', error);
        }
      }
      
      // Then, resolve some of the acknowledged incidents (first 1-2)
      const incidentsToResolve = acknowledgedIncidentIds.slice(0, Math.min(2, acknowledgedIncidentIds.length));
      for (const incidentId of incidentsToResolve) {
        try {
          // Get the incident's acknowledged_at
          const { rows: incidentRows } = await Database.query(
            `SELECT acknowledged_at FROM incidents WHERE id = $1`,
            [incidentId]
          );
          if (incidentRows.length > 0 && incidentRows[0].acknowledged_at) {
            const acknowledgedAt = new Date(incidentRows[0].acknowledged_at);
            // Set resolved_at to 5-30 minutes after acknowledged_at (simulating realistic resolution time)
            const resolveDelayMinutes = Math.round(5 + Math.random() * 25); // 5-30 minutes
            const resolvedAt = new Date(acknowledgedAt.getTime() + resolveDelayMinutes * 60 * 1000);
            await Database.query(
              `UPDATE incidents 
               SET status = 'resolved', resolved_at = $1
               WHERE id = $2`,
              [resolvedAt, incidentId]
            );
          }
        } catch (error) {
          console.error('Failed to resolve incident:', error);
        }
      }
    }
    
    res.json({ 
      success: true, 
      schedulesGenerated: schedules.length,
      incidentsCreated,
      message: 'Demo data setup complete'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function start() {
  try {
    await Database.initialize();
    await RedisCache.connect();
    
    // Subscribe to Redis events and broadcast
    try {
      await RedisCache.subscribe('incidents', (message) => {
        broadcast({ type: 'incident_update', data: message });
      });
    } catch (error) {
      console.error('Failed to subscribe to Redis:', error);
    }
    
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`WebSocket server on ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
