import { Pool } from 'pg';
import { ComplianceMetric } from '../models/SecurityEvent';

export class ComplianceMonitor {
  private db: Pool;

  constructor() {
    this.db = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'twitter_soc',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });
  }

  async generateReport(periodHours: number = 24): Promise<ComplianceMetric> {
    const period = `${periodHours}h`;

    const [events, threats, incidents, responseTimes, accessAudits] = await Promise.all([
      this.countEvents(periodHours),
      this.countThreats(periodHours),
      this.countIncidents(periodHours),
      this.calculateMTTR(periodHours),
      this.countDataAccess(periodHours)
    ]);

    const complianceScore = this.calculateComplianceScore(
      threats.detected,
      threats.total,
      responseTimes.avg
    );

    return {
      period,
      totalEvents: events,
      threatsDetected: threats.detected,
      incidentsResolved: incidents,
      averageResponseTime: responseTimes.avg,
      dataAccessAudits: accessAudits,
      complianceScore
    };
  }

  private async countEvents(hours: number): Promise<number> {
    const result = await this.db.query(`
      SELECT COUNT(*) as count
      FROM security_events
      WHERE timestamp > NOW() - INTERVAL '${hours} hours'
    `);
    return parseInt(result.rows[0].count);
  }

  private async countThreats(hours: number): Promise<{ total: number; detected: number }> {
    const result = await this.db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN threat_score >= 0.5 THEN 1 END) as detected
      FROM security_events
      WHERE timestamp > NOW() - INTERVAL '${hours} hours'
    `);
    return {
      total: parseInt(result.rows[0].total),
      detected: parseInt(result.rows[0].detected)
    };
  }

  private async countIncidents(hours: number): Promise<number> {
    const result = await this.db.query(`
      SELECT COUNT(*) as count
      FROM incident_responses
      WHERE timestamp > NOW() - INTERVAL '${hours} hours'
    `);
    return parseInt(result.rows[0].count);
  }

  private async calculateMTTR(hours: number): Promise<{ avg: number; p50: number; p95: number }> {
    const result = await this.db.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (ir.timestamp - se.timestamp))) as avg_seconds,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ir.timestamp - se.timestamp))) as p50,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ir.timestamp - se.timestamp))) as p95
      FROM incident_responses ir
      JOIN security_events se ON ir.event_id = se.id
      WHERE ir.timestamp > NOW() - INTERVAL '${hours} hours'
    `);

    if (result.rows.length === 0) {
      return { avg: 0, p50: 0, p95: 0 };
    }

    return {
      avg: parseFloat(result.rows[0].avg_seconds) || 0,
      p50: parseFloat(result.rows[0].p50) || 0,
      p95: parseFloat(result.rows[0].p95) || 0
    };
  }

  private async countDataAccess(hours: number): Promise<number> {
    const result = await this.db.query(`
      SELECT COUNT(*) as count
      FROM security_events
      WHERE event_type = 'DATA_ACCESS'
        AND timestamp > NOW() - INTERVAL '${hours} hours'
    `);
    return parseInt(result.rows[0].count);
  }

  private calculateComplianceScore(
    threatsDetected: number,
    totalEvents: number,
    avgResponseTime: number
  ): number {
    // Simple scoring: detection rate + response speed
    const detectionRate = totalEvents > 0 ? (threatsDetected / totalEvents) : 0;
    const responseScore = avgResponseTime < 1 ? 1.0 : Math.max(0, 1 - (avgResponseTime / 10));
    
    return Math.min((detectionRate * 0.6 + responseScore * 0.4) * 100, 100);
  }

  async cleanup(): Promise<void> {
    await this.db.end();
  }
}
