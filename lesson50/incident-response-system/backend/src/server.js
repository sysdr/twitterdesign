import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import { initDatabase } from './models/database.js';
import { classifier } from './ml/classifier.js';
import alertRoutes from './routes/alerts.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    services: ['classifier', 'remediation', 'escalation', 'post-incident']
  });
});

// API routes
app.use('/api', alertRoutes);

// WebSocket for real-time updates
wss.on('connection', (ws) => {
  console.log('Dashboard connected via WebSocket');
  ws.send(JSON.stringify({ type: 'connected', message: 'Real-time updates active' }));
});

// Broadcast incident updates
export function broadcastIncidentUpdate(incident) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify({ type: 'incident_update', incident }));
    }
  });
}

const PORT = process.env.PORT || 3050;

async function startServer() {
  console.log('Initializing Incident Response System...');
  
  await initDatabase();
  await classifier.initialize();
  
  server.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✓ Incident Response System running on port ${PORT}`);
    console.log(`  API: http://localhost:${PORT}/api`);
    console.log(`  Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`  Health: http://localhost:${PORT}/health`);
    console.log(`${'='.repeat(60)}\n`);
  });
}

startServer().catch(console.error);
