import { db } from '../models/database.js';

export class EscalationService {
  constructor() {
    this.escalationPolicies = {
      'P0': { delay: 60000, channel: 'phone' },    // 1 minute
      'P1': { delay: 120000, channel: 'sms' },     // 2 minutes
      'P2': { delay: 300000, channel: 'slack' },   // 5 minutes
      'P3': { delay: 600000, channel: 'email' }    // 10 minutes
    };
  }

  async checkEscalation(incident) {
    const elapsed = Date.now() - incident.created_at;
    const policy = this.escalationPolicies[incident.severity];

    if (!policy || elapsed < policy.delay) {
      return null;
    }

    // Check if already escalated
    if (incident.escalated_at) {
      return null;
    }

    console.log(`Escalating incident ${incident.id} (${incident.severity}) via ${policy.channel}`);

    const oncall = await this.getOnCallEngineer(incident.service);
    await this.notifyEngineer(oncall, incident, policy.channel);
    
    await db.query(
      `UPDATE incidents 
       SET escalated_at = $1, escalated_to = $2 
       WHERE id = $3`,
      [Date.now(), oncall.engineer_name, incident.id]
    );

    return {
      escalated_to: oncall.engineer_name,
      channel: policy.channel,
      timestamp: Date.now()
    };
  }

  async getOnCallEngineer(service) {
    const now = Date.now();
    const result = await db.query(
      `SELECT * FROM oncall_schedule 
       WHERE service = $1 
       AND shift_start <= $2 
       AND shift_end >= $2 
       LIMIT 1`,
      [service, now]
    );

    if (result.rows.length === 0) {
      // Fallback to any engineer for the service
      const fallback = await db.query(
        'SELECT * FROM oncall_schedule WHERE service = $1 LIMIT 1',
        [service]
      );
      return fallback.rows[0] || {
        engineer_name: 'Default On-Call',
        engineer_contact: 'oncall@twitter.local'
      };
    }

    return result.rows[0];
  }

  async notifyEngineer(oncall, incident, channel) {
    const summary = this.generateSummary(incident);
    
    console.log(`\n📞 ESCALATION NOTIFICATION`);
    console.log(`Channel: ${channel.toUpperCase()}`);
    console.log(`To: ${oncall.engineer_name} (${oncall.engineer_contact})`);
    console.log(`Severity: ${incident.severity}`);
    console.log(`Service: ${incident.service}`);
    console.log(`Summary: ${summary}`);
    console.log(`Dashboard: http://localhost:3050/dashboard#incident-${incident.id}`);
    console.log(`Actions Tried: ${JSON.stringify(incident.actions_taken, null, 2)}`);
    console.log('─'.repeat(60));

    // In production, would integrate with PagerDuty, Twilio, Slack, etc.
    return {
      sent: true,
      channel,
      recipient: oncall.engineer_name,
      timestamp: Date.now()
    };
  }

  generateSummary(incident) {
    const duration = incident.resolved_at 
      ? incident.resolved_at - incident.created_at 
      : Date.now() - incident.created_at;
    
    return `${incident.alert_name} on ${incident.service} (${Math.floor(duration / 1000)}s)`;
  }
}

export const escalationService = new EscalationService();
