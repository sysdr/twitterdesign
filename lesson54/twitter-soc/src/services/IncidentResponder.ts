import { SecurityEvent, ThreatScore, IncidentResponse } from '../models/SecurityEvent';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export class IncidentResponder {
  private redis: Redis;
  private db: Pool;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    });

    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'twitter_soc',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });
  }

  async respond(threat: ThreatScore, event: SecurityEvent): Promise<IncidentResponse> {
    const startTime = Date.now();
    const incidentId = uuidv4();
    let action = '';
    let status: 'PENDING' | 'EXECUTED' | 'FAILED' = 'PENDING';

    try {
      switch (threat.recommendedAction) {
        case 'BLOCK':
          await this.blockIPAddress(event.ipAddress, 3600000); // 1 hour
          action = `Blocked IP ${event.ipAddress} for 1 hour`;
          await this.notifySecurityTeam('HIGH', event, threat);
          break;

        case 'RATE_LIMIT':
          await this.applyStrictRateLimit(event.ipAddress, 300000); // 5 minutes
          if (event.userId) {
            await this.requireMFA(event.userId);
          }
          action = `Applied strict rate limiting to ${event.ipAddress}`;
          break;

        case 'MONITOR':
          await this.flagForReview(event, threat);
          await this.increaseLogging(event.userId || event.ipAddress);
          action = `Flagged for security review`;
          break;

        default:
          action = 'Logged for monitoring';
      }

      status = 'EXECUTED';
      
      // Record incident in audit log
      await this.recordIncident(incidentId, threat, event, action);

    } catch (error) {
      console.error('Incident response error:', error);
      status = 'FAILED';
      action = `Failed: ${error}`;
    }

    const executionTime = Date.now() - startTime;

    return {
      incidentId,
      timestamp: new Date(),
      threatScore: threat,
      event,
      action,
      status,
      executionTime
    };
  }

  private async blockIPAddress(ip: string, durationMs: number): Promise<void> {
    const key = `blocked:${ip}`;
    await this.redis.set(key, '1', 'PX', durationMs);
  }

  private async applyStrictRateLimit(ip: string, durationMs: number): Promise<void> {
    const key = `strict_limit:${ip}`;
    await this.redis.set(key, '1', 'PX', durationMs);
  }

  private async requireMFA(userId: string): Promise<void> {
    const key = `require_mfa:${userId}`;
    await this.redis.set(key, '1', 'EX', 3600); // 1 hour
  }

  private async flagForReview(event: SecurityEvent, threat: ThreatScore): Promise<void> {
    await this.db.query(`
      INSERT INTO security_reviews (event_id, threat_score, threat_type, timestamp)
      VALUES ($1, $2, $3, NOW())
    `, [event.id, threat.score, threat.threatType]);
  }

  private async increaseLogging(identifier: string): Promise<void> {
    const key = `verbose_logging:${identifier}`;
    await this.redis.set(key, '1', 'EX', 3600);
  }

  private async notifySecurityTeam(severity: string, event: SecurityEvent, threat: ThreatScore): Promise<void> {
    // In production, send to Slack, PagerDuty, etc.
    console.log(`🚨 SECURITY ALERT [${severity}]`);
    console.log(`Threat Type: ${threat.threatType}`);
    console.log(`Score: ${threat.score.toFixed(2)}`);
    console.log(`IP: ${event.ipAddress}`);
    console.log(`Reasoning: ${threat.reasoning.join(', ')}`);
  }

  private async recordIncident(
    incidentId: string,
    threat: ThreatScore,
    event: SecurityEvent,
    action: string
  ): Promise<void> {
    await this.db.query(`
      INSERT INTO incident_responses 
      (incident_id, event_id, threat_score, threat_type, action, timestamp)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [incidentId, event.id, threat.score, threat.threatType, action]);
  }

  async cleanup(): Promise<void> {
    await this.redis.quit();
    await this.db.end();
  }
}
