import pg from 'pg';
import { createClient } from 'redis';

const { Pool } = pg;

export const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'incidents',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

await redis.connect();

export async function initDatabase() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS incidents (
      id SERIAL PRIMARY KEY,
      alert_name VARCHAR(255) NOT NULL,
      severity VARCHAR(10) NOT NULL,
      status VARCHAR(50) NOT NULL,
      service VARCHAR(100) NOT NULL,
      metrics JSONB,
      created_at BIGINT NOT NULL,
      classified_at BIGINT,
      resolved_at BIGINT,
      escalated_at BIGINT,
      escalated_to VARCHAR(100),
      resolved_by VARCHAR(50),
      incident_type VARCHAR(100),
      confidence DECIMAL(3,2),
      actions_taken JSONB DEFAULT '[]'::jsonb,
      timeline JSONB DEFAULT '[]'::jsonb
    );

    CREATE TABLE IF NOT EXISTS remediation_playbooks (
      id SERIAL PRIMARY KEY,
      incident_type VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      steps JSONB NOT NULL,
      success_rate DECIMAL(3,2) DEFAULT 0.5,
      avg_duration INT DEFAULT 30000
    );

    CREATE TABLE IF NOT EXISTS oncall_schedule (
      id SERIAL PRIMARY KEY,
      service VARCHAR(100) NOT NULL,
      engineer_name VARCHAR(100) NOT NULL,
      engineer_contact VARCHAR(255) NOT NULL,
      shift_start BIGINT NOT NULL,
      shift_end BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS postmortems (
      id SERIAL PRIMARY KEY,
      incident_id INT REFERENCES incidents(id),
      content TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      action_items JSONB DEFAULT '[]'::jsonb
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
    CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_incidents_service ON incidents(service);
  `);

  // Insert sample playbooks
  await db.query(`
    INSERT INTO remediation_playbooks (incident_type, name, steps, success_rate, avg_duration)
    VALUES 
      ('database_connection_exhaustion', 'DB Connection Pool Recovery', 
       '[
         {"name": "check_pool_stats", "action": "query", "timeout": 5000},
         {"name": "kill_long_queries", "action": "kill_queries", "threshold": 30000},
         {"name": "scale_pool", "action": "scale", "amount": 20},
         {"name": "verify_recovery", "action": "check_metrics", "timeout": 30000}
       ]'::jsonb, 0.85, 45000),
      ('service_crash', 'Service Restart Recovery', 
       '[
         {"name": "check_restart_count", "action": "query", "threshold": 3},
         {"name": "analyze_crash_logs", "action": "log_analysis", "timeout": 10000},
         {"name": "restart_service", "action": "restart", "timeout": 30000},
         {"name": "monitor_startup", "action": "health_check", "timeout": 60000}
       ]'::jsonb, 0.75, 60000),
      ('high_error_rate', 'Error Rate Reduction', 
       '[
         {"name": "identify_error_pattern", "action": "analyze", "timeout": 10000},
         {"name": "clear_cache", "action": "cache_clear", "timeout": 5000},
         {"name": "scale_capacity", "action": "scale", "amount": 2},
         {"name": "verify_error_rate", "action": "check_metrics", "timeout": 30000}
       ]'::jsonb, 0.80, 50000),
      ('cascading_failure', 'Cascade Prevention', 
       '[
         {"name": "enable_circuit_breaker", "action": "circuit_breaker", "timeout": 5000},
         {"name": "reduce_traffic", "action": "traffic_control", "percentage": 50},
         {"name": "scale_up", "action": "scale", "amount": 2},
         {"name": "gradual_ramp", "action": "traffic_ramp", "increment": 10}
       ]'::jsonb, 0.70, 90000)
    ON CONFLICT (incident_type) DO NOTHING;
  `);

  // Insert sample on-call schedule
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  await db.query(`
    INSERT INTO oncall_schedule (service, engineer_name, engineer_contact, shift_start, shift_end)
    VALUES 
      ('tweet-service', 'Alice Smith', 'alice@twitter.local', $1, $2),
      ('user-service', 'Bob Johnson', 'bob@twitter.local', $1, $2),
      ('timeline-service', 'Carol Williams', 'carol@twitter.local', $1, $2)
  `, [now, now + 7 * dayMs]);

  console.log('✓ Database initialized with schema and seed data');
}
