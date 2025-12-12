import { db } from '../models/database.js';
import fs from 'fs/promises';
import path from 'path';

export class PostIncidentAnalyzer {
  async generatePostMortem(incidentId) {
    const incident = await this.getIncidentDetails(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const timeline = incident.timeline || [];
    const duration = incident.resolved_at - incident.created_at;
    const actionItems = await this.generateActionItems(incident);

    const postmortem = this.buildPostMortemMarkdown(incident, timeline, duration, actionItems);

    // Save to database and file
    await db.query(
      `INSERT INTO postmortems (incident_id, content, created_at, action_items)
       VALUES ($1, $2, $3, $4)`,
      [incidentId, postmortem, Date.now(), JSON.stringify(actionItems)]
    );

    const filepath = path.join(process.cwd(), 'data/postmortems', `incident-${incidentId}.md`);
    await fs.writeFile(filepath, postmortem);

    console.log(`✓ Postmortem generated for incident ${incidentId}`);
    return postmortem;
  }

  async getIncidentDetails(incidentId) {
    const result = await db.query(
      'SELECT * FROM incidents WHERE id = $1',
      [incidentId]
    );
    return result.rows[0];
  }

  buildPostMortemMarkdown(incident, timeline, duration, actionItems) {
    const formatTime = (ts) => new Date(ts).toISOString();
    const formatDuration = (ms) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
    };

    const successfulActions = timeline.filter(e => 
      e.type === 'remediation' && e.result === 'success'
    );

    const estimateImpact = () => {
      const severityImpact = {
        'P0': 'Customer-facing outage affecting all users',
        'P1': 'Degraded service affecting subset of users',
        'P2': 'Internal systems impacted, users unaffected',
        'P3': 'Warning condition, no user impact'
      };
      return severityImpact[incident.severity] || 'Unknown impact';
    };

    return `# Incident ${incident.id} - ${incident.alert_name}

## Summary
**Service**: ${incident.service}
**Severity**: ${incident.severity}
**Duration**: ${formatDuration(duration)}
**Impact**: ${estimateImpact()}
**Resolution**: ${incident.resolved_by === 'automation' ? 'Automated' : 'Manual'}

## Timeline
${timeline.map(e => 
  `- **${formatTime(e.timestamp)}**: ${e.description}${e.result ? ` (${e.result})` : ''}`
).join('\n')}

## Root Cause
${this.analyzeRootCause(incident, timeline)}

## What Went Well
- Automated detection within ${Math.floor((incident.classified_at - incident.created_at) / 1000)}s
${successfulActions.map(a => `- Successfully executed: ${a.description}`).join('\n')}
${incident.resolved_by === 'automation' ? '- Auto-resolved without engineer intervention' : ''}

## What Didn't Go Well
${this.identifyIssues(incident, timeline)}

## Action Items
${actionItems.map((item, i) => `${i + 1}. **${item.priority}**: ${item.description} (Owner: ${item.owner})`).join('\n')}

## Metrics
- **MTTR**: ${formatDuration(duration)}
- **Auto-resolution**: ${incident.resolved_by === 'automation' ? 'Yes' : 'No'}
- **Actions Taken**: ${(incident.actions_taken || []).length}
- **Escalated**: ${incident.escalated_at ? 'Yes' : 'No'}

---
*Generated automatically on ${formatTime(Date.now())}*
`;
  }

  analyzeRootCause(incident, timeline) {
    const rootCauses = {
      'database_connection_exhaustion': 'Connection pool exhausted due to slow queries or connection leaks',
      'service_crash': 'Service crashed due to unhandled exception or resource exhaustion',
      'high_error_rate': 'Error rate spike caused by invalid requests or downstream service failure',
      'cascading_failure': 'Failure propagated from upstream service affecting multiple downstream systems',
      'memory_leak': 'Memory leak causing gradual performance degradation',
      'network_partition': 'Network connectivity issues between services'
    };

    return rootCauses[incident.incident_type] || 'Root cause analysis pending';
  }

  identifyIssues(incident, timeline) {
    const issues = [];

    if (incident.escalated_at) {
      issues.push('- Automated remediation failed, required human intervention');
    }

    const failedActions = timeline.filter(e => 
      e.type === 'remediation' && e.result === 'failure'
    );
    if (failedActions.length > 0) {
      issues.push(`- ${failedActions.length} remediation action(s) failed`);
    }

    if (issues.length === 0) {
      return '- None identified';
    }

    return issues.join('\n');
  }

  async generateActionItems(incident) {
    const items = [];

    if (incident.escalated_at) {
      items.push({
        priority: 'HIGH',
        description: `Improve auto-remediation playbook for ${incident.incident_type}`,
        owner: 'SRE Team'
      });
    }

    if (incident.confidence < 0.7) {
      items.push({
        priority: 'MEDIUM',
        description: 'Retrain ML classifier with more examples of this incident type',
        owner: 'ML Team'
      });
    }

    items.push({
      priority: 'LOW',
      description: `Review monitoring thresholds for ${incident.service}`,
      owner: incident.escalated_to || 'Service Team'
    });

    return items;
  }
}

export const postIncidentAnalyzer = new PostIncidentAnalyzer();
