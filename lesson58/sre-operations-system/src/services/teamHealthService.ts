import { Database } from './database';
import { TeamHealthMetrics } from '../models/types';

export class TeamHealthService {
  static async calculateMetrics(): Promise<TeamHealthMetrics> {
    const { rows: weeklyIncidents } = await Database.query(`
      SELECT COUNT(*) as count FROM incidents 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    // Calculate avg_ack based on incidents that have been acknowledged (regardless of resolution)
    const { rows: ackMetrics } = await Database.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at))) as avg_ack
      FROM incidents
      WHERE created_at > NOW() - INTERVAL '7 days'
      AND acknowledged_at IS NOT NULL
    `);

    // Calculate avg_resolve based on incidents that have been resolved
    const { rows: resolveMetrics } = await Database.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_resolve
      FROM incidents
      WHERE created_at > NOW() - INTERVAL '7 days'
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
    const avgAck = parseFloat(ackMetrics[0]?.avg_ack || '0');
    const avgResolve = parseFloat(resolveMetrics[0]?.avg_resolve || '0');
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
