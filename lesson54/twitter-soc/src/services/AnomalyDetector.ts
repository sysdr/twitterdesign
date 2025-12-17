import { SecurityEvent } from '../models/SecurityEvent';
import { Pool } from 'pg';

export class AnomalyDetector {
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

  async analyze(event: SecurityEvent): Promise<{ score: number; reason: string }> {
    if (!event.userId) {
      return { score: 0.2, reason: 'No user context for anomaly detection' };
    }

    // Get user's baseline behavior
    const baseline = await this.getUserBaseline(event.userId, event.eventType);
    
    if (!baseline) {
      return { score: 0.1, reason: 'Insufficient baseline data' };
    }

    // Compare current behavior to baseline
    const deviation = this.calculateDeviation(event, baseline);

    if (deviation >= 3.0) {
      return {
        score: 0.95,
        reason: `Severe anomaly: ${deviation.toFixed(1)}x deviation from baseline`
      };
    } else if (deviation >= 2.0) {
      return {
        score: 0.75,
        reason: `Moderate anomaly: ${deviation.toFixed(1)}x deviation from baseline`
      };
    } else if (deviation >= 1.5) {
      return {
        score: 0.50,
        reason: `Minor anomaly: ${deviation.toFixed(1)}x deviation from baseline`
      };
    }

    return { score: deviation * 0.3, reason: 'Behavior within normal range' };
  }

  private async getUserBaseline(userId: string, eventType: string): Promise<any> {
    try {
      const result = await this.db.query(`
        SELECT 
          AVG(hourly_count) as avg_count,
          STDDEV(hourly_count) as std_dev
        FROM (
          SELECT 
            DATE_TRUNC('hour', timestamp) as hour,
            COUNT(*) as hourly_count
          FROM security_events
          WHERE user_id = $1 
            AND event_type = $2
            AND timestamp > NOW() - INTERVAL '7 days'
          GROUP BY DATE_TRUNC('hour', timestamp)
        ) hourly_stats
      `, [userId, eventType]);

      if (result.rows.length === 0) return null;
      
      return {
        avgCount: parseFloat(result.rows[0].avg_count) || 0,
        stdDev: parseFloat(result.rows[0].std_dev) || 1
      };
    } catch (error) {
      console.error('Baseline query error:', error);
      return null;
    }
  }

  private calculateDeviation(event: SecurityEvent, baseline: any): number {
    // Simple z-score calculation
    // In production, use more sophisticated time-series analysis
    const recentActivity = 10; // Placeholder for actual recent activity count
    const zScore = Math.abs((recentActivity - baseline.avgCount) / baseline.stdDev);
    return zScore;
  }

  async cleanup(): Promise<void> {
    await this.db.end();
  }
}
