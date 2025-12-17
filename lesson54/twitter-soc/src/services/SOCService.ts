import { SecurityEvent, ThreatScore, IncidentResponse } from '../models/SecurityEvent';
import { ThreatAnalyzer } from './ThreatAnalyzer';
import { IncidentResponder } from './IncidentResponder';
import { ComplianceMonitor } from './ComplianceMonitor';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

export class SOCService extends EventEmitter {
  private analyzer: ThreatAnalyzer;
  private responder: IncidentResponder;
  private compliance: ComplianceMonitor;
  private db: Pool;
  private stats = {
    eventsProcessed: 0,
    threatsDetected: 0,
    incidentsResponded: 0,
    averageProcessingTime: 0
  };

  constructor(db: Pool) {
    super();
    this.db = db;
    this.analyzer = new ThreatAnalyzer();
    this.responder = new IncidentResponder();
    this.compliance = new ComplianceMonitor();
  }

  async processEvent(event: Partial<SecurityEvent>): Promise<{
    event: SecurityEvent;
    threat: ThreatScore;
    response?: IncidentResponse;
  }> {
    const startTime = Date.now();

    // Create full security event
    const securityEvent: SecurityEvent = {
      id: event.id || uuidv4(),
      timestamp: event.timestamp || new Date(),
      eventType: event.eventType || 'SYSTEM',
      userId: event.userId,
      ipAddress: event.ipAddress || '0.0.0.0',
      userAgent: event.userAgent || 'unknown',
      action: event.action || 'unknown',
      outcome: event.outcome || 'SUCCESS',
      metadata: event.metadata || {}
    };

    // Analyze threat
    const threat = await this.analyzer.analyzeEvent(securityEvent);
    securityEvent.threatScore = threat.score;

    // Store event
    await this.storeEvent(securityEvent, threat);

    // Respond if needed
    let response: IncidentResponse | undefined;
    if (threat.recommendedAction !== 'ALLOW') {
      response = await this.responder.respond(threat, securityEvent);
      this.stats.incidentsResponded++;
    }

    // Update statistics
    this.stats.eventsProcessed++;
    if (threat.score >= 0.5) {
      this.stats.threatsDetected++;
    }

    const processingTime = Date.now() - startTime;
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.eventsProcessed - 1) + processingTime) 
      / this.stats.eventsProcessed;

    // Emit event for real-time dashboard
    this.emit('threatDetected', { event: securityEvent, threat, response });

    return { event: securityEvent, threat, response };
  }

  private async storeEvent(event: SecurityEvent, threat: ThreatScore): Promise<void> {
    await this.db.query(`
      INSERT INTO security_events 
      (id, timestamp, event_type, user_id, ip_address, user_agent, action, outcome, metadata, threat_score, response_action)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      event.id,
      event.timestamp,
      event.eventType,
      event.userId,
      event.ipAddress,
      event.userAgent,
      event.action,
      event.outcome,
      JSON.stringify(event.metadata),
      threat.score,
      threat.recommendedAction
    ]);
  }

  getStats() {
    return { ...this.stats };
  }

  async getComplianceReport(hours: number = 24) {
    return await this.compliance.generateReport(hours);
  }

  async getRecentThreats(limit: number = 50) {
    const result = await this.db.query(`
      SELECT * FROM security_events
      WHERE threat_score >= 0.5
      ORDER BY timestamp DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  async cleanup(): Promise<void> {
    await this.db.end();
  }
}
