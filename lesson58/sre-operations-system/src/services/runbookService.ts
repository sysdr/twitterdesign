import { Database } from './database';
import { Runbook, Incident } from '../models/types';

export class RunbookService {
  static async findMatchingRunbook(incident: Incident): Promise<Runbook | null> {
    const { rows } = await Database.query(
      `SELECT * FROM runbooks 
       WHERE trigger_pattern = $1 
       ORDER BY success_rate DESC LIMIT 1`,
      [incident.component]
    );

    return rows[0] || null;
  }

  static async executeRunbook(runbookId: string, _incident: Incident): Promise<any> {
    const { rows } = await Database.query(
      'SELECT * FROM runbooks WHERE id = $1',
      [runbookId]
    );

    if (rows.length === 0) {
      return { success: false, error: 'Runbook not found' };
    }

    const runbook = rows[0];
    const executedSteps: string[] = [];
    const startTime = Date.now();

    // Simulate step execution
    for (const step of runbook.steps) {
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulate work
      executedSteps.push(step.action);
    }

    const executionTime = Date.now() - startTime;

    // Update runbook statistics
    await Database.query(
      `UPDATE runbooks SET 
       execution_count = execution_count + 1,
       avg_execution_time = (avg_execution_time * execution_count + $1) / (execution_count + 1),
       success_rate = (success_rate * execution_count + 100) / (execution_count + 1)
       WHERE id = $2`,
      [executionTime, runbookId]
    );

    return {
      success: true,
      executedSteps,
      executionTime
    };
  }

  static async getAllRunbooks(): Promise<Runbook[]> {
    const { rows } = await Database.query(
      'SELECT * FROM runbooks ORDER BY execution_count DESC'
    );

    // Convert database values to proper types (DECIMAL comes as string from PostgreSQL)
    return rows.map((row: any) => ({
      ...row,
      success_rate: row.success_rate != null ? (typeof row.success_rate === 'string' ? parseFloat(row.success_rate) : Number(row.success_rate)) : 0,
      avg_execution_time: row.avg_execution_time != null ? (typeof row.avg_execution_time === 'string' ? parseInt(row.avg_execution_time, 10) : Number(row.avg_execution_time)) : 0,
      execution_count: row.execution_count != null ? (typeof row.execution_count === 'string' ? parseInt(row.execution_count, 10) : Number(row.execution_count)) : 0,
    }));
  }
}
