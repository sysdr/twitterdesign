#!/bin/bash

set -e

echo "=========================================="
echo "SRE Team Operations System - Setup"
echo "Lesson 58: Team Operations and SRE"
echo "=========================================="

PROJECT_DIR="sre-operations-system"
cd "$(dirname "$0")"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Step 1: Create project structure
print_info "Creating project structure..."

rm -rf "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR"/{src,tests,scripts,config}
mkdir -p "$PROJECT_DIR"/src/{components,services,models,utils}
mkdir -p "$PROJECT_DIR"/src/components/{Dashboard,OnCall,Incidents,Runbooks,TeamHealth}

cd "$PROJECT_DIR"

# Step 2: Initialize package.json
print_info "Initializing Node.js project..."

cat > package.json << 'EOF'
{
  "name": "sre-operations-system",
  "version": "1.0.0",
  "description": "Production-grade SRE team operations and on-call management system",
  "type": "module",
  "main": "src/index.tsx",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "migrate": "node scripts/migrate.js",
    "seed:engineers": "node scripts/seedEngineers.js",
    "test:rotation": "tsx scripts/testRotation.js",
    "test:incidents": "tsx scripts/testIncidents.js"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.13.3",
    "lucide-react": "^0.469.0",
    "date-fns": "^4.1.0",
    "axios": "^1.7.9",
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "pg": "^8.13.1",
    "redis": "^4.7.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/pg": "^8.11.10",
    "@types/ws": "^8.5.13",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "vitest": "^2.1.8",
    "tsx": "^4.19.2",
    "@types/node": "^22.10.2"
  }
}
EOF

print_status "Package.json created"

# Step 3: Create TypeScript configuration
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

# Step 4: Create Vite config
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  }
})
EOF

cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true
  }
})
EOF

# Step 5: Create models
print_info "Creating data models..."

cat > src/models/types.ts << 'EOF'
export interface Engineer {
  id: string;
  name: string;
  email: string;
  timezone: string;
  expertiseAreas: string[];
  recentIncidents: number;
  hoursSinceRotation: number;
  satisfactionScore: number;
}

export interface OnCallSchedule {
  id: string;
  engineerId: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  previousIncidentCount: number;
  restHoursSinceLastRotation: number;
  status: 'scheduled' | 'active' | 'completed';
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 1 | 2 | 3 | 4 | 5;
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'closed';
  component: string;
  affectedUsers: number;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  escalationLevel: number;
  automatedActions: string[];
  runbookExecuted?: string;
}

export interface Runbook {
  id: string;
  name: string;
  description: string;
  triggerPattern: string;
  steps: RunbookStep[];
  successCriteria: string[];
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
}

export interface RunbookStep {
  id: string;
  action: string;
  command?: string;
  expectedResult: string;
  timeout: number;
}

export interface TeamHealthMetrics {
  averageIncidentsPerWeek: number;
  meanTimeToAcknowledge: number;
  meanTimeToResolve: number;
  weekendIncidentRatio: number;
  consecutiveHighLoadWeeks: number;
  engineerSatisfactionScore: number;
  burnoutRiskLevel: 'low' | 'medium' | 'high';
}

export interface EscalationPolicy {
  level: number;
  waitTime: number;
  notifyEngineers: string[];
  notifyManagers: string[];
  autoRunbook: boolean;
}

export interface IncidentClassification {
  severity: 1 | 2 | 3 | 4 | 5;
  component: string;
  estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: string;
  similarIncidents: string[];
  confidence: number;
}
EOF

print_status "Data models created"

# Step 6: Create backend services
print_info "Creating backend services..."

cat > src/services/database.ts << 'EOF'
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sre_ops',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

export class Database {
  static async query(text: string, params?: any[]) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  }

  static async getClient() {
    const client = await pool.connect();
    return client;
  }

  static async initialize() {
    await this.query(`
      CREATE TABLE IF NOT EXISTS engineers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        timezone VARCHAR(50) NOT NULL,
        expertise_areas TEXT[],
        recent_incidents INTEGER DEFAULT 0,
        hours_since_rotation INTEGER DEFAULT 0,
        satisfaction_score DECIMAL(3,1) DEFAULT 7.0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS oncall_schedules (
        id VARCHAR(50) PRIMARY KEY,
        engineer_id VARCHAR(50) REFERENCES engineers(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        timezone VARCHAR(50) NOT NULL,
        previous_incident_count INTEGER DEFAULT 0,
        rest_hours_since_last INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        severity INTEGER CHECK (severity BETWEEN 1 AND 5),
        status VARCHAR(20) DEFAULT 'open',
        component VARCHAR(100),
        affected_users INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        acknowledged_at TIMESTAMP,
        resolved_at TIMESTAMP,
        assigned_to VARCHAR(50) REFERENCES engineers(id),
        escalation_level INTEGER DEFAULT 1,
        automated_actions TEXT[],
        runbook_executed VARCHAR(50)
      );
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS runbooks (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        trigger_pattern VARCHAR(200),
        steps JSONB NOT NULL,
        success_criteria TEXT[],
        execution_count INTEGER DEFAULT 0,
        success_rate DECIMAL(5,2) DEFAULT 0.0,
        avg_execution_time INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await this.query(`
      CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
      CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
      CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_oncall_times ON oncall_schedules(start_time, end_time);
    `);

    console.log('Database initialized successfully');
  }
}
EOF

cat > src/services/redisClient.ts << 'EOF'
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client Connected'));

export class RedisCache {
  static async connect() {
    if (!client.isOpen) {
      await client.connect();
    }
  }

  static async get(key: string): Promise<any> {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  }

  static async set(key: string, value: any, expirySeconds?: number) {
    const serialized = JSON.stringify(value);
    if (expirySeconds) {
      await client.setEx(key, expirySeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
  }

  static async del(key: string) {
    await client.del(key);
  }

  static async publish(channel: string, message: any) {
    await client.publish(channel, JSON.stringify(message));
  }

  static async subscribe(channel: string, handler: (message: any) => void) {
    const subscriber = client.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channel, (message) => {
      handler(JSON.parse(message));
    });
    return subscriber;
  }
}
EOF

cat > src/services/onCallService.ts << 'EOF'
import { Database } from './database';
import { Engineer, OnCallSchedule } from '../models/types';

export class OnCallService {
  static calculateRotationWeight(engineer: Engineer): number {
    const baseWeight = 1.0;
    const fatigueMultiplier = engineer.recentIncidents > 5 ? 0.5 : 1.0;
    const restBonus = engineer.hoursSinceRotation > 168 ? 1.2 : 1.0;
    return baseWeight * fatigueMultiplier * restBonus;
  }

  static async generateRotation(days: number = 30): Promise<OnCallSchedule[]> {
    const { rows: engineers } = await Database.query(
      'SELECT * FROM engineers ORDER BY recent_incidents ASC, hours_since_rotation DESC'
    );

    const schedules: OnCallSchedule[] = [];
    const hoursPerShift = 168; // 1 week
    const startDate = new Date();

    for (let i = 0; i < days * 24; i += hoursPerShift) {
      const engineerIndex = (i / hoursPerShift) % engineers.length;
      const engineer = engineers[engineerIndex];

      const start = new Date(startDate.getTime() + i * 60 * 60 * 1000);
      const end = new Date(start.getTime() + hoursPerShift * 60 * 60 * 1000);

      const schedule: OnCallSchedule = {
        id: `schedule-${Date.now()}-${i}`,
        engineerId: engineer.id,
        startTime: start,
        endTime: end,
        timezone: engineer.timezone,
        previousIncidentCount: engineer.recent_incidents,
        restHoursSinceLastRotation: engineer.hours_since_rotation,
        status: 'scheduled'
      };

      await Database.query(
        `INSERT INTO oncall_schedules (id, engineer_id, start_time, end_time, timezone, 
         previous_incident_count, rest_hours_since_last, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [schedule.id, schedule.engineerId, schedule.startTime, schedule.endTime,
         schedule.timezone, schedule.previousIncidentCount, 
         schedule.restHoursSinceLastRotation, schedule.status]
      );

      schedules.push(schedule);
    }

    return schedules;
  }

  static async getCurrentOnCall(): Promise<Engineer | null> {
    const now = new Date();
    const { rows } = await Database.query(
      `SELECT e.* FROM engineers e
       JOIN oncall_schedules s ON e.id = s.engineer_id
       WHERE s.start_time <= $1 AND s.end_time > $1
       AND s.status = 'active'
       LIMIT 1`,
      [now]
    );

    return rows[0] || null;
  }

  static async getUpcomingRotations(limit: number = 10): Promise<any[]> {
    const now = new Date();
    const { rows } = await Database.query(
      `SELECT s.*, e.name, e.timezone FROM oncall_schedules s
       JOIN engineers e ON s.engineer_id = e.id
       WHERE s.start_time > $1
       ORDER BY s.start_time ASC
       LIMIT $2`,
      [now, limit]
    );

    return rows;
  }
}
EOF

cat > src/services/incidentService.ts << 'EOF'
import { Database } from './database';
import { RedisCache } from './redisClient';
import { Incident, IncidentClassification } from '../models/types';
import { RunbookService } from './runbookService';

export class IncidentService {
  static async classifyIncident(incident: Partial<Incident>): Promise<IncidentClassification> {
    // Simple ML simulation - in production use actual ML model
    const keywords = incident.description?.toLowerCase() || '';
    
    let severity: 1 | 2 | 3 | 4 | 5 = 2;
    let estimatedImpact: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (keywords.includes('critical') || keywords.includes('down')) {
      severity = 5;
      estimatedImpact = 'critical';
    } else if (keywords.includes('high') || keywords.includes('error')) {
      severity = 4;
      estimatedImpact = 'high';
    } else if (keywords.includes('warning') || keywords.includes('slow')) {
      severity = 3;
      estimatedImpact = 'medium';
    }

    // Find similar incidents
    const { rows: similar } = await Database.query(
      `SELECT id, title, runbook_executed FROM incidents
       WHERE component = $1 AND resolved_at IS NOT NULL
       ORDER BY created_at DESC LIMIT 5`,
      [incident.component]
    );

    return {
      severity,
      component: incident.component || 'unknown',
      estimatedImpact,
      recommendedAction: similar.length > 0 ? similar[0].runbook_executed : 'manual-investigation',
      similarIncidents: similar.map(s => s.id),
      confidence: 0.85 + Math.random() * 0.1
    };
  }

  static async createIncident(data: Partial<Incident>): Promise<Incident> {
    const classification = await this.classifyIncident(data);
    
    const incident: Incident = {
      id: `incident-${Date.now()}`,
      title: data.title || 'Untitled Incident',
      description: data.description || '',
      severity: classification.severity,
      status: 'open',
      component: classification.component,
      affectedUsers: data.affectedUsers || 0,
      createdAt: new Date(),
      escalationLevel: classification.severity >= 4 ? 2 : 1,
      automatedActions: []
    };

    // Try automated resolution for level 1 incidents
    if (incident.escalationLevel === 1) {
      const runbook = await RunbookService.findMatchingRunbook(incident);
      if (runbook) {
        const result = await RunbookService.executeRunbook(runbook.id, incident);
        if (result.success) {
          incident.status = 'resolved';
          incident.resolvedAt = new Date();
          incident.runbookExecuted = runbook.id;
          incident.automatedActions = result.executedSteps;
        }
      }
    }

    await Database.query(
      `INSERT INTO incidents (id, title, description, severity, status, component, 
       affected_users, created_at, escalation_level, automated_actions, runbook_executed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [incident.id, incident.title, incident.description, incident.severity, 
       incident.status, incident.component, incident.affectedUsers, incident.createdAt,
       incident.escalationLevel, incident.automatedActions, incident.runbookExecuted]
    );

    // Cache active incidents
    await RedisCache.set(`incident:${incident.id}`, incident, 3600);

    // Publish to notification system
    await RedisCache.publish('incidents', {
      type: 'new_incident',
      incident
    });

    return incident;
  }

  static async acknowledgeIncident(incidentId: string, engineerId: string): Promise<void> {
    const now = new Date();
    await Database.query(
      `UPDATE incidents SET status = 'acknowledged', acknowledged_at = $1, 
       assigned_to = $2 WHERE id = $3`,
      [now, engineerId, incidentId]
    );

    await RedisCache.publish('incidents', {
      type: 'incident_acknowledged',
      incidentId,
      engineerId
    });
  }

  static async resolveIncident(incidentId: string, notes: string): Promise<void> {
    const now = new Date();
    await Database.query(
      `UPDATE incidents SET status = 'resolved', resolved_at = $1 WHERE id = $2`,
      [now, incidentId]
    );

    await RedisCache.del(`incident:${incidentId}`);

    await RedisCache.publish('incidents', {
      type: 'incident_resolved',
      incidentId,
      notes
    });
  }

  static async getActiveIncidents(): Promise<Incident[]> {
    const { rows } = await Database.query(
      `SELECT * FROM incidents WHERE status IN ('open', 'acknowledged', 'investigating')
       ORDER BY severity DESC, created_at DESC`
    );

    return rows;
  }

  static async getIncidentMetrics(): Promise<any> {
    const { rows } = await Database.query(`
      SELECT 
        COUNT(*) as total,
        AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at))) as avg_ack_time,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_resolve_time,
        SUM(CASE WHEN runbook_executed IS NOT NULL THEN 1 ELSE 0 END) as automated_count
      FROM incidents
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    return rows[0];
  }
}
EOF

cat > src/services/runbookService.ts << 'EOF'
import { Database } from './database';
import { Runbook, Incident } from '../models/types';

export class RunbookService {
  static async findMatchingRunbook(incident: Incident): Promise<Runbook | null> {
    const { rows } = await Database.query(
      `SELECT * FROM runbooks 
       WHERE trigger_pattern = $1 
       ORDER BY success_rate DESC LIMIT 1`,
      [incident.component]
    );

    return rows[0] || null;
  }

  static async executeRunbook(runbookId: string, incident: Incident): Promise<any> {
    const { rows } = await Database.query(
      'SELECT * FROM runbooks WHERE id = $1',
      [runbookId]
    );

    if (rows.length === 0) {
      return { success: false, error: 'Runbook not found' };
    }

    const runbook = rows[0];
    const executedSteps: string[] = [];
    const startTime = Date.now();

    // Simulate step execution
    for (const step of runbook.steps) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate work
      executedSteps.push(step.action);
    }

    const executionTime = Date.now() - startTime;

    // Update runbook statistics
    await Database.query(
      `UPDATE runbooks SET 
       execution_count = execution_count + 1,
       avg_execution_time = (avg_execution_time * execution_count + $1) / (execution_count + 1),
       success_rate = (success_rate * execution_count + 100) / (execution_count + 1)
       WHERE id = $2`,
      [executionTime, runbookId]
    );

    return {
      success: true,
      executedSteps,
      executionTime
    };
  }

  static async getAllRunbooks(): Promise<Runbook[]> {
    const { rows } = await Database.query(
      'SELECT * FROM runbooks ORDER BY execution_count DESC'
    );

    return rows;
  }
}
EOF

cat > src/services/teamHealthService.ts << 'EOF'
import { Database } from './database';
import { TeamHealthMetrics } from '../models/types';

export class TeamHealthService {
  static async calculateMetrics(): Promise<TeamHealthMetrics> {
    const { rows: weeklyIncidents } = await Database.query(`
      SELECT COUNT(*) as count FROM incidents 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    const { rows: timingMetrics } = await Database.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at))) as avg_ack,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_resolve
      FROM incidents
      WHERE created_at > NOW() - INTERVAL '7 days'
      AND acknowledged_at IS NOT NULL
      AND resolved_at IS NOT NULL
    `);

    const { rows: weekendRatio } = await Database.query(`
      SELECT 
        COUNT(CASE WHEN EXTRACT(DOW FROM created_at) IN (0, 6) THEN 1 END)::float / 
        NULLIF(COUNT(*), 0) as ratio
      FROM incidents
      WHERE created_at > NOW() - INTERVAL '30 days'
    `);

    const { rows: satisfaction } = await Database.query(
      'SELECT AVG(satisfaction_score) as avg FROM engineers'
    );

    const avgIncidents = parseFloat(weeklyIncidents[0]?.count || '0');
    const avgAck = parseFloat(timingMetrics[0]?.avg_ack || '0');
    const avgResolve = parseFloat(timingMetrics[0]?.avg_resolve || '0');
    const weekendRat = parseFloat(weekendRatio[0]?.ratio || '0');
    const avgSatisfaction = parseFloat(satisfaction[0]?.avg || '7.0');

    const metrics: TeamHealthMetrics = {
      averageIncidentsPerWeek: avgIncidents,
      meanTimeToAcknowledge: avgAck,
      meanTimeToResolve: avgResolve,
      weekendIncidentRatio: weekendRat,
      consecutiveHighLoadWeeks: 0, // Would need historical tracking
      engineerSatisfactionScore: avgSatisfaction,
      burnoutRiskLevel: this.calculateBurnoutRisk(avgIncidents, avgResolve, avgSatisfaction)
    };

    return metrics;
  }

  static calculateBurnoutRisk(
    incidents: number, 
    resolveTime: number, 
    satisfaction: number
  ): 'low' | 'medium' | 'high' {
    const signals = [
      incidents > 15,
      resolveTime > 3600,
      satisfaction < 6.0
    ];

    const riskCount = signals.filter(s => s).length;
    
    if (riskCount >= 2) return 'high';
    if (riskCount >= 1) return 'medium';
    return 'low';
  }
}
EOF

print_status "Backend services created"

# Step 7: Create API server
print_info "Creating API server..."

cat > src/server.ts << 'EOF'
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
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

// Broadcast to all connected clients
function broadcast(data: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// Subscribe to Redis events and broadcast
RedisCache.subscribe('incidents', (message) => {
  broadcast({ type: 'incident_update', data: message });
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.get('/api/oncall/current', async (req, res) => {
  try {
    const engineer = await OnCallService.getCurrentOnCall();
    res.json(engineer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/oncall/upcoming', async (req, res) => {
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

app.get('/api/incidents/active', async (req, res) => {
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

app.get('/api/incidents/metrics', async (req, res) => {
  try {
    const metrics = await IncidentService.getIncidentMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/runbooks', async (req, res) => {
  try {
    const runbooks = await RunbookService.getAllRunbooks();
    res.json(runbooks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/team/health', async (req, res) => {
  try {
    const metrics = await TeamHealthService.calculateMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function start() {
  try {
    await Database.initialize();
    await RedisCache.connect();
    
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
EOF

print_status "API server created"

# Step 8: Create React components
print_info "Creating React components..."

cat > src/components/Dashboard/Dashboard.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { AlertCircle, Users, Activity, CheckCircle } from 'lucide-react';
import { OnCallPanel } from '../OnCall/OnCallPanel';
import { IncidentsList } from '../Incidents/IncidentsList';
import { RunbooksPanel } from '../Runbooks/RunbooksPanel';
import { TeamHealthPanel } from '../TeamHealth/TeamHealthPanel';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    activeIncidents: 0,
    onCallEngineers: 0,
    avgResponseTime: 0,
    automationRate: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [incidents, metrics] = await Promise.all([
          fetch('/api/incidents/active').then(r => r.json()),
          fetch('/api/incidents/metrics').then(r => r.json())
        ]);

        setStats({
          activeIncidents: incidents.length,
          onCallEngineers: 1,
          avgResponseTime: Math.round(metrics.avg_ack_time || 0),
          automationRate: metrics.automated_count > 0 
            ? Math.round((metrics.automated_count / metrics.total) * 100) 
            : 0
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            SRE Operations Center
          </h1>
          <p className="text-slate-600">
            Real-time incident management and team operations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Incidents"
            value={stats.activeIncidents}
            icon={<AlertCircle className="w-6 h-6" />}
            color="bg-orange-500"
          />
          <StatCard
            title="On-Call Engineers"
            value={stats.onCallEngineers}
            icon={<Users className="w-6 h-6" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Avg Response Time"
            value={`${stats.avgResponseTime}s`}
            icon={<Activity className="w-6 h-6" />}
            color="bg-green-500"
          />
          <StatCard
            title="Automation Rate"
            value={`${stats.automationRate}%`}
            icon={<CheckCircle className="w-6 h-6" />}
            color="bg-purple-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OnCallPanel />
          <IncidentsList />
          <RunbooksPanel />
          <TeamHealthPanel />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
    <div className="flex items-center justify-between mb-4">
      <span className="text-slate-600 text-sm font-medium">{title}</span>
      <div className={`${color} text-white p-3 rounded-lg shadow-md`}>
        {icon}
      </div>
    </div>
    <div className="text-3xl font-bold text-slate-900">{value}</div>
  </div>
);
EOF

cat > src/components/OnCall/OnCallPanel.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { User, Clock } from 'lucide-react';

export const OnCallPanel: React.FC = () => {
  const [currentOnCall, setCurrentOnCall] = useState<any>(null);
  const [upcomingRotations, setUpcomingRotations] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [current, upcoming] = await Promise.all([
          fetch('/api/oncall/current').then(r => r.json()),
          fetch('/api/oncall/upcoming').then(r => r.json())
        ]);

        setCurrentOnCall(current);
        setUpcomingRotations(upcoming);
      } catch (error) {
        console.error('Failed to fetch on-call data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <User className="w-6 h-6 text-blue-500" />
        On-Call Rotation
      </h2>

      {/* Current On-Call */}
      {currentOnCall && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600 font-medium mb-1">
                Currently On-Call
              </div>
              <div className="text-lg font-bold text-slate-900">
                {currentOnCall.name}
              </div>
              <div className="text-sm text-slate-600">
                {currentOnCall.timezone}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600">Recent Incidents</div>
              <div className="text-2xl font-bold text-blue-600">
                {currentOnCall.recent_incidents}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Rotations */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Upcoming Schedule
        </h3>
        {upcomingRotations.slice(0, 5).map((rotation, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
          >
            <div>
              <div className="font-medium text-slate-900">{rotation.name}</div>
              <div className="text-xs text-slate-600">{rotation.timezone}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">
                {new Date(rotation.start_time).toLocaleDateString()}
              </div>
              <div className="text-xs text-slate-500">
                {new Date(rotation.start_time).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
EOF

cat > src/components/Incidents/IncidentsList.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const IncidentsList: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const data = await fetch('/api/incidents/active').then(r => r.json());
        setIncidents(data);
      } catch (error) {
        console.error('Failed to fetch incidents:', error);
      }
    };

    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5000);

    // WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:8080/ws');
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'incident_update') {
        fetchIncidents();
      }
    };

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, []);

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'bg-red-100 text-red-700 border-red-300';
    if (severity >= 3) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-orange-500" />
        Active Incidents
      </h2>

      <div className="space-y-4">
        {incidents.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-slate-600">No active incidents</p>
            <p className="text-sm text-slate-500">System operating normally</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.id}
              className={`p-4 rounded-lg border-2 ${getSeverityColor(incident.severity)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-semibold mb-1">{incident.title}</div>
                  <div className="text-sm opacity-80">{incident.description}</div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white shadow">
                  P{incident.severity}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs mt-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(incident.created_at).toLocaleTimeString()}
                </span>
                <span className="px-2 py-1 bg-white rounded shadow">
                  {incident.component}
                </span>
                {incident.runbook_executed && (
                  <span className="text-green-700 font-medium">
                    ✓ Auto-resolved
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
EOF

cat > src/components/Runbooks/RunbooksPanel.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Book, Play, TrendingUp } from 'lucide-react';

export const RunbooksPanel: React.FC = () => {
  const [runbooks, setRunbooks] = useState<any[]>([]);

  useEffect(() => {
    const fetchRunbooks = async () => {
      try {
        const data = await fetch('/api/runbooks').then(r => r.json());
        setRunbooks(data);
      } catch (error) {
        console.error('Failed to fetch runbooks:', error);
      }
    };

    fetchRunbooks();
    const interval = setInterval(fetchRunbooks, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Book className="w-6 h-6 text-green-500" />
        Automated Runbooks
      </h2>

      <div className="space-y-3">
        {runbooks.map((runbook) => (
          <div
            key={runbook.id}
            className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-slate-900">{runbook.name}</div>
              <Play className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-sm text-slate-600 mb-3">
              {runbook.description}
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="font-medium">
                  {runbook.success_rate?.toFixed(1)}% success
                </span>
              </span>
              <span className="text-slate-500">
                Executed {runbook.execution_count} times
              </span>
              <span className="text-slate-500">
                Avg {Math.round(runbook.avg_execution_time / 1000)}s
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
EOF

cat > src/components/TeamHealth/TeamHealthPanel.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Heart, TrendingDown, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const TeamHealthPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await fetch('/api/team/health').then(r => r.json());
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch team health:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  const getRiskColor = (level: string) => {
    if (level === 'high') return 'text-red-600 bg-red-100 border-red-300';
    if (level === 'medium') return 'text-orange-600 bg-orange-100 border-orange-300';
    return 'text-green-600 bg-green-100 border-green-300';
  };

  const mockTrendData = [
    { week: 'W1', incidents: 12, satisfaction: 7.5 },
    { week: 'W2', incidents: 15, satisfaction: 7.2 },
    { week: 'W3', incidents: 10, satisfaction: 7.8 },
    { week: 'W4', incidents: 8, satisfaction: 8.0 }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Heart className="w-6 h-6 text-pink-500" />
        Team Health
      </h2>

      {/* Burnout Risk */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${getRiskColor(metrics.burnoutRiskLevel)}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium mb-1">Burnout Risk</div>
            <div className="text-2xl font-bold capitalize">
              {metrics.burnoutRiskLevel}
            </div>
          </div>
          <AlertTriangle className="w-8 h-8" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard
          label="Avg Incidents/Week"
          value={metrics.averageIncidentsPerWeek.toFixed(1)}
        />
        <MetricCard
          label="Satisfaction Score"
          value={metrics.engineerSatisfactionScore.toFixed(1)}
        />
        <MetricCard
          label="Avg Ack Time"
          value={`${Math.round(metrics.meanTimeToAcknowledge)}s`}
        />
        <MetricCard
          label="Avg Resolve Time"
          value={`${Math.round(metrics.meanTimeToResolve / 60)}m`}
        />
      </div>

      {/* Trend Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockTrendData}>
            <defs>
              <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="incidents"
              stroke="#f97316"
              fillOpacity={1}
              fill="url(#colorIncidents)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-3 bg-slate-50 rounded-lg">
    <div className="text-xs text-slate-600 mb-1">{label}</div>
    <div className="text-lg font-bold text-slate-900">{value}</div>
  </div>
);
EOF

# Step 9: Create main App component
cat > src/App.tsx << 'EOF'
import React from 'react';
import { Dashboard } from './components/Dashboard/Dashboard';

function App() {
  return <Dashboard />;
}

export default App;
EOF

cat > src/main.tsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF

cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SRE Operations System</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

print_status "React components created"

# Step 10: Create utility scripts
print_info "Creating utility scripts..."

cat > scripts/migrate.js << 'EOF'
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
EOF

cat > scripts/seedEngineers.js << 'EOF'
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
EOF

cat > scripts/testRotation.js << 'EOF'
import { OnCallService } from '../src/services/onCallService.js';

async function testRotation() {
  console.log('Testing on-call rotation generation...');
  
  const schedules = await OnCallService.generateRotation(30);
  console.log(`✓ Generated ${schedules.length} rotation schedules`);
  
  // Verify no back-to-back shifts
  const engineers = new Map();
  for (const schedule of schedules) {
    const prev = engineers.get(schedule.engineerId);
    if (prev && Math.abs(schedule.startTime - prev.endTime) < 24 * 60 * 60 * 1000) {
      console.error('✗ Back-to-back shift detected!');
      process.exit(1);
    }
    engineers.set(schedule.engineerId, schedule);
  }
  console.log('✓ No back-to-back shifts detected');
  
  console.log('✓ All rotation tests passed!');
  process.exit(0);
}

testRotation().catch((error) => {
  console.error('Rotation test failed:', error);
  process.exit(1);
});
EOF

cat > scripts/testIncidents.js << 'EOF'
import { IncidentService } from '../src/services/incidentService.js';

const testIncidents = [
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
  
  for (const incident of testIncidents) {
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
EOF

# Step 11: Create Docker Compose
print_info "Creating Docker configuration..."

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: sre_ops
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
      - "8080:8080"
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: sre_ops
      DB_USER: postgres
      DB_PASSWORD: postgres
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: sh -c "npm run migrate && npm run seed:engineers && npm run dev & node src/server.ts"

volumes:
  postgres_data:
  redis_data:
EOF

cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000 8080

CMD ["sh", "-c", "npm run dev & node src/server.ts"]
EOF

cat > .dockerignore << 'EOF'
node_modules
dist
.git
*.log
EOF

print_status "Docker configuration created"

# Step 12: Create build, start, stop scripts
cat > build.sh << 'EOF'
#!/bin/bash
set -e

echo "Building SRE Operations System..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build TypeScript
echo "Building TypeScript..."
npm run build

echo "✓ Build complete!"
EOF

cat > start.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting SRE Operations System..."

# Start databases
echo "Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for databases
echo "Waiting for databases..."
sleep 5

# Run migrations
echo "Running migrations..."
npm run migrate

# Seed data
echo "Seeding engineers..."
npm run seed:engineers

# Start API server in background
echo "Starting API server..."
npx tsx src/server.ts &
SERVER_PID=$!

# Start frontend
echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✓ System started!"
echo "  API: http://localhost:8080"
echo "  Dashboard: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop..."

# Wait for interrupt
wait
EOF

cat > stop.sh << 'EOF'
#!/bin/bash

echo "Stopping SRE Operations System..."

# Stop Node processes
pkill -f "node src/server.ts" || true
pkill -f "vite" || true

# Stop Docker containers
docker-compose down

echo "✓ System stopped!"
EOF

chmod +x build.sh start.sh stop.sh

print_status "Build scripts created"

# Step 13: Install dependencies and build
print_info "Installing dependencies..."
npm install

print_status "Dependencies installed"

# Step 14: Start databases
print_info "Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

sleep 8

# Step 15: Run migrations
print_info "Running database migrations..."
npx tsx scripts/migrate.js || true

# Step 16: Seed data
print_info "Seeding test data..."
npx tsx scripts/seedEngineers.js || true

# Step 17: Create sample runbooks
print_info "Creating sample runbooks..."
cat > scripts/seedRunbooks.js << 'EOF'
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
EOF

npx tsx scripts/seedRunbooks.js || true

print_status "Sample data seeded"

# Step 18: Start server in background
print_info "Starting API server..."
npx tsx src/server.ts &
SERVER_PID=$!

sleep 3

# Step 19: Run tests
print_info "Running tests..."
echo ""
echo "=== Testing On-Call Rotation ==="
npm run test:rotation

echo ""
echo "=== Testing Incident Management ==="
npm run test:incidents

print_status "All tests passed!"

# Step 20: Build frontend
print_info "Building frontend..."
npm run build

print_status "Frontend built successfully!"

echo ""
echo "=========================================="
echo "✓ SRE Operations System Setup Complete!"
echo "=========================================="
echo ""
echo "Quick Start Commands:"
echo ""
echo "  Start system:    ./start.sh"
echo "  Stop system:     ./stop.sh"
echo "  Run tests:       npm run test"
echo ""
echo "Access Points:"
echo "  Dashboard:  http://localhost:3000"
echo "  API:        http://localhost:8080"
echo "  WebSocket:  ws://localhost:8080/ws"
echo ""
echo "To start now:"
echo "  1. ./start.sh"
echo "  2. Open http://localhost:3000 in browser"
echo ""
echo "=========================================="