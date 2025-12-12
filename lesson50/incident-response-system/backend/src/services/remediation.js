import { db, redis } from '../models/database.js';

export class RemediationService {
  constructor() {
    this.maxActionsPerIncident = 3;
    this.actionCooldownMs = 2000;
  }

  async executeRemediation(incidentId, incidentType) {
    console.log(`Starting remediation for incident ${incidentId}, type: ${incidentType}`);

    // Get playbook
    const playbook = await this.getPlaybook(incidentType);
    if (!playbook) {
      console.log(`No playbook found for ${incidentType}`);
      return { success: false, reason: 'no_playbook' };
    }

    const results = [];
    let actionCount = 0;

    for (const step of playbook.steps) {
      if (actionCount >= this.maxActionsPerIncident) {
        console.log('Max actions reached, stopping');
        break;
      }

      try {
        console.log(`Executing step: ${step.name}`);
        const result = await this.executeStep(step, incidentId);
        results.push({ step: step.name, status: 'success', result, timestamp: Date.now() });
        actionCount++;

        // Add timeline entry
        await this.addTimelineEntry(incidentId, {
          type: 'remediation',
          description: `Executed ${step.name}`,
          result: 'success',
          timestamp: Date.now()
        });

        // Check if issue is resolved
        await new Promise(resolve => setTimeout(resolve, this.actionCooldownMs));
        
        if (await this.isResolved(incidentId)) {
          console.log(`✓ Incident ${incidentId} resolved after ${results.length} actions`);
          await this.markResolved(incidentId, results);
          return { success: true, steps: results };
        }

      } catch (error) {
        console.error(`Step ${step.name} failed:`, error.message);
        results.push({ step: step.name, status: 'failed', error: error.message, timestamp: Date.now() });
        
        await this.addTimelineEntry(incidentId, {
          type: 'remediation',
          description: `Failed: ${step.name}`,
          result: 'failure',
          error: error.message,
          timestamp: Date.now()
        });
        break;
      }
    }

    console.log(`Remediation incomplete, escalating incident ${incidentId}`);
    return { success: false, steps: results, reason: 'remediation_failed' };
  }

  async getPlaybook(incidentType) {
    const result = await db.query(
      'SELECT * FROM remediation_playbooks WHERE incident_type = $1',
      [incidentType]
    );
    return result.rows[0];
  }

  async executeStep(step, incidentId) {
    // Simulate action execution with realistic delays
    const actionSimulations = {
      query: () => this.simulateQuery(step),
      kill_queries: () => this.simulateKillQueries(step),
      scale: () => this.simulateScale(step),
      check_metrics: () => this.simulateCheckMetrics(step),
      restart: () => this.simulateRestart(step),
      log_analysis: () => this.simulateLogAnalysis(step),
      health_check: () => this.simulateHealthCheck(step),
      cache_clear: () => this.simulateCacheClear(step),
      circuit_breaker: () => this.simulateCircuitBreaker(step),
      traffic_control: () => this.simulateTrafficControl(step),
      traffic_ramp: () => this.simulateTrafficRamp(step)
    };

    const simulate = actionSimulations[step.action];
    if (!simulate) {
      throw new Error(`Unknown action: ${step.action}`);
    }

    const timeout = step.timeout || 10000;
    return await Promise.race([
      simulate(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Action timeout')), timeout)
      )
    ]);
  }

  async simulateQuery(step) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { pool_size: 100, active: 95, idle: 5 };
  }

  async simulateKillQueries(step) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { queries_killed: 5, duration: 2000 };
  }

  async simulateScale(step) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const amount = step.amount || 1;
    return { scaled_by: amount, new_capacity: 100 + amount * 10 };
  }

  async simulateCheckMetrics(step) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    // 80% chance of improvement
    const improved = Math.random() > 0.2;
    return { 
      error_rate: improved ? 0.02 : 0.15,
      latency_p99: improved ? 400 : 1200,
      status: improved ? 'healthy' : 'degraded'
    };
  }

  async simulateRestart(step) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    return { restarted: true, startup_time: 5000 };
  }

  async simulateLogAnalysis(step) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { 
      pattern: 'OutOfMemoryError',
      occurrences: 3,
      last_seen: Date.now() - 60000
    };
  }

  async simulateHealthCheck(step) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { healthy: Math.random() > 0.15, response_time: 150 };
  }

  async simulateCacheClear(step) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { keys_cleared: 1523, memory_freed: '256MB' };
  }

  async simulateCircuitBreaker(step) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { circuit: 'OPEN', timeout: 60000 };
  }

  async simulateTrafficControl(step) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const percentage = step.percentage || 50;
    return { traffic_reduced_to: percentage, affected_services: 2 };
  }

  async simulateTrafficRamp(step) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    const increment = step.increment || 10;
    return { traffic_increased_by: increment, current_traffic: 60 };
  }

  async isResolved(incidentId) {
    // Simulate checking if incident is resolved (80% success rate for auto-remediation)
    return Math.random() > 0.2;
  }

  async markResolved(incidentId, actions) {
    await db.query(
      `UPDATE incidents 
       SET status = 'resolved', 
           resolved_at = $1, 
           resolved_by = 'automation',
           actions_taken = $2
       WHERE id = $3`,
      [Date.now(), JSON.stringify(actions), incidentId]
    );

    await this.addTimelineEntry(incidentId, {
      type: 'resolution',
      description: 'Incident auto-resolved',
      timestamp: Date.now()
    });
  }

  async addTimelineEntry(incidentId, entry) {
    await db.query(
      `UPDATE incidents 
       SET timeline = timeline || $1::jsonb 
       WHERE id = $2`,
      [JSON.stringify(entry), incidentId]
    );
  }
}

export const remediationService = new RemediationService();
