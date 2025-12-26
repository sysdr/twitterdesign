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
