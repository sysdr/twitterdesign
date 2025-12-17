import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from './utils/database';
import { SOCService } from './services/SOCService';
import { SecurityEvent } from './models/SecurityEvent';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());
const cspDirectives = [
  "default-src 'self' data: blob:",
  "connect-src * data: blob: filesystem: ws: wss:",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self' data:"
].join('; ');

app.use((_, res, next) => {
  res.setHeader('Content-Security-Policy', cspDirectives);
  next();
});
app.all('/.well-known/appspecific/com.chrome.devtools.json', (_, res) => {
  res
    .status(200)
    .type('application/json')
    .send(JSON.stringify({ status: 'ok' }));
});
app.use(
  '/.well-known',
  express.static(path.join(__dirname, '..', 'public/.well-known'), { dotfiles: 'allow' })
);
app.use(express.static('public', { dotfiles: 'allow' }));
app.get(['/','/dashboard'], (_, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

let socService: SOCService;

// Initialize
async function initialize() {
  const db = await initializeDatabase();
  socService = new SOCService(db);

  // Broadcast threats to WebSocket clients
  socService.on('threatDetected', (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify({
          type: 'threat',
          data
        }));
      }
    });
  });

  console.log('✓ SOC Service initialized');
}

// API Routes
app.post('/api/security/event', async (req, res) => {
  try {
    const result = await socService.processEvent(req.body);
    res.json(result);
  } catch (error) {
    console.error('Event processing error:', error);
    res.status(500).json({ error: 'Failed to process security event' });
  }
});

app.get('/api/security/stats', async (req, res) => {
  try {
    const stats = socService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

app.get('/api/security/threats', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const threats = await socService.getRecentThreats(limit);
    res.json(threats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get threats' });
  }
});

app.get('/api/security/compliance/report', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const report = await socService.getComplianceReport(hours);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.use((req, res) => {
  res
    .status(404)
    .setHeader('Content-Security-Policy', cspDirectives)
    .json({ error: 'Not found', path: req.originalUrl });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Dashboard connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  ws.on('close', () => {
    console.log('Dashboard disconnected');
  });
});

const PORT = process.env.PORT || 3004;

initialize().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🔒 Security Operations Center running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  });
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await socService.cleanup();
  process.exit(0);
});
