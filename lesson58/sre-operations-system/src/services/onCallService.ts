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
    // First try to find active schedule
    let { rows } = await Database.query(
      `SELECT e.*, s.start_time as schedule_start, s.end_time as schedule_end 
       FROM engineers e
       JOIN oncall_schedules s ON e.id = s.engineer_id
       WHERE s.start_time <= $1 AND s.end_time > $1
       AND s.status = 'active'
       LIMIT 1`,
      [now]
    );

    // If no active schedule, find scheduled one and activate it
    if (rows.length === 0) {
      const { rows: scheduledRows } = await Database.query(
        `SELECT e.*, s.id as schedule_id, s.start_time as schedule_start, s.end_time as schedule_end 
         FROM engineers e
         JOIN oncall_schedules s ON e.id = s.engineer_id
         WHERE s.start_time <= $1 AND s.end_time > $1
         AND s.status = 'scheduled'
         LIMIT 1`,
        [now]
      );

      if (scheduledRows.length > 0) {
        // Activate this schedule
        await Database.query(
          `UPDATE oncall_schedules SET status = 'active' WHERE id = $1`,
          [scheduledRows[0].schedule_id]
        );
        rows = scheduledRows;
      }
    }

    if (rows.length === 0) {
      return null;
    }

    const engineer = rows[0];
    
    // Calculate recent incidents count: incidents created in the last 7 days
    // Since incidents aren't always assigned, we count all recent incidents
    // that the on-call engineer would be responsible for
    const { rows: incidentRows } = await Database.query(
      `SELECT COUNT(*) as count FROM incidents 
       WHERE created_at >= NOW() - INTERVAL '7 days'`,
      []
    );

    // Add the dynamically calculated recent incidents count
    engineer.recent_incidents = parseInt(incidentRows[0]?.count || '0', 10);

    // Remove the temporary schedule fields we added
    delete engineer.schedule_start;
    delete engineer.schedule_end;
    delete engineer.schedule_id;

    return engineer;
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
