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
    // Get total count and automated count for all incidents
    const { rows: totalRows } = await Database.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN runbook_executed IS NOT NULL THEN 1 ELSE 0 END) as automated_count
      FROM incidents
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    // Get average times only for incidents that have been acknowledged
    const { rows: timingRows } = await Database.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at))) as avg_ack_time,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_resolve_time
      FROM incidents
      WHERE created_at > NOW() - INTERVAL '7 days'
      AND acknowledged_at IS NOT NULL
    `);

    return {
      ...totalRows[0],
      avg_ack_time: timingRows[0]?.avg_ack_time || null,
      avg_resolve_time: timingRows[0]?.avg_resolve_time || null
    };
  }
}
