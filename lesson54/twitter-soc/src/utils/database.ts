import { Pool } from 'pg';

export async function initializeDatabase(): Promise<Pool> {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'twitter_soc',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  });

  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS security_events (
      id VARCHAR(36) PRIMARY KEY,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      event_type VARCHAR(50) NOT NULL,
      user_id VARCHAR(255),
      ip_address VARCHAR(45) NOT NULL,
      user_agent TEXT,
      action VARCHAR(100) NOT NULL,
      outcome VARCHAR(20) NOT NULL,
      metadata JSONB,
      threat_score DECIMAL(3, 2),
      response_action TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON security_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_user ON security_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_ip ON security_events(ip_address);
    CREATE INDEX IF NOT EXISTS idx_events_type ON security_events(event_type);

    CREATE TABLE IF NOT EXISTS incident_responses (
      incident_id VARCHAR(36) PRIMARY KEY,
      event_id VARCHAR(36) REFERENCES security_events(id),
      threat_score DECIMAL(3, 2) NOT NULL,
      threat_type VARCHAR(100) NOT NULL,
      action TEXT NOT NULL,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      execution_time INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_timestamp ON incident_responses(timestamp);
    CREATE INDEX IF NOT EXISTS idx_incidents_event ON incident_responses(event_id);

    CREATE TABLE IF NOT EXISTS security_reviews (
      id SERIAL PRIMARY KEY,
      event_id VARCHAR(36) REFERENCES security_events(id),
      threat_score DECIMAL(3, 2) NOT NULL,
      threat_type VARCHAR(100) NOT NULL,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      reviewed BOOLEAN DEFAULT FALSE,
      reviewer VARCHAR(255),
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON security_reviews(reviewed);
  `);

  console.log('✓ Database tables initialized');
  return pool;
}
