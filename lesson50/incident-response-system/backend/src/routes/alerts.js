import express from 'express';
import { db, redis } from '../models/database.js';
import { classifier } from '../ml/classifier.js';
import { remediationService } from '../services/remediation.js';
import { escalationService } from '../services/escalation.js';
import { postIncidentAnalyzer } from '../services/post-incident.js';

const router = express.Router();

router.post('/alerts', async (req, res) => {
  try {
    const alert = req.body;
    console.log('\n📢 Alert received:', alert.alert_name, 'for', alert.affected_service);

    // Check for duplicate/similar incidents in last 5 minutes
    const existing = await findSimilarIncident(alert);
    if (existing) {
      console.log(`Linking to existing incident ${existing.id}`);
      await linkAlertToIncident(existing.id, alert);
      return res.json({ incident_id: existing.id, status: 'linked' });
    }

    // Create new incident
    const severity = classifySeverity(alert);
    const incident = await createIncident(alert, severity);
    
    console.log(`✓ Created incident ${incident.id} with severity ${severity}`);

    // Trigger async processing
    processIncident(incident.id).catch(err => 
      console.error(`Error processing incident ${incident.id}:`, err)
    );

    res.json({ incident_id: incident.id, status: 'created', severity });
  } catch (error) {
    console.error('Alert handling error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function findSimilarIncident(alert) {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const result = await db.query(
    `SELECT * FROM incidents 
     WHERE service = $1 
     AND alert_name = $2 
     AND created_at > $3 
     AND status != 'resolved'
     ORDER BY created_at DESC
     LIMIT 1`,
    [alert.affected_service, alert.alert_name, fiveMinutesAgo]
  );
  return result.rows[0];
}

async function linkAlertToIncident(incidentId, alert) {
  await db.query(
    `UPDATE incidents 
     SET timeline = timeline || $1::jsonb 
     WHERE id = $2`,
    [JSON.stringify({
      type: 'alert',
      description: `Similar alert: ${alert.alert_name}`,
      timestamp: Date.now()
    }), incidentId]
  );
}

function classifySeverity(alert) {
  if (alert.severity === 'critical') return 'P0';
  if (alert.severity === 'high') return 'P1';
  if (alert.severity === 'medium') return 'P2';
  return 'P3';
}

async function createIncident(alert, severity) {
  const result = await db.query(
    `INSERT INTO incidents 
     (alert_name, severity, status, service, metrics, created_at, timeline)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      alert.alert_name,
      severity,
      'detected',
      alert.affected_service,
      JSON.stringify(alert.metrics || {}),
      Date.now(),
      JSON.stringify([{
        type: 'detection',
        description: `Alert: ${alert.alert_name}`,
        timestamp: Date.now()
      }])
    ]
  );
  return result.rows[0];
}

async function processIncident(incidentId) {
  const incident = await getIncident(incidentId);
  
  // Classification phase
  console.log(`\n🔍 Classifying incident ${incidentId}...`);
  const prediction = await classifier.predict(incident);
  
  await db.query(
    `UPDATE incidents 
     SET incident_type = $1, confidence = $2, classified_at = $3, status = 'classified'
     WHERE id = $4`,
    [prediction.type, prediction.confidence, Date.now(), incidentId]
  );

  console.log(`✓ Classified as: ${prediction.type} (confidence: ${(prediction.confidence * 100).toFixed(1)}%)`);

  // Try automated remediation
  console.log(`\n🔧 Attempting automated remediation...`);
  const remediationResult = await remediationService.executeRemediation(
    incidentId,
    prediction.type
  );

  if (remediationResult.success) {
    console.log(`✅ Incident ${incidentId} auto-resolved in ${formatDuration(Date.now() - incident.created_at)}`);
    
    // Generate postmortem
    setTimeout(() => {
      postIncidentAnalyzer.generatePostMortem(incidentId).catch(console.error);
    }, 2000);
    
    return;
  }

  // Escalation phase
  console.log(`\n⚠️  Auto-remediation failed, monitoring for escalation...`);
  await db.query(
    `UPDATE incidents SET status = 'escalation_pending' WHERE id = $1`,
    [incidentId]
  );

  // Check for escalation after appropriate delay
  setTimeout(async () => {
    const currentIncident = await getIncident(incidentId);
    if (currentIncident.status !== 'resolved') {
      const escalation = await escalationService.checkEscalation(currentIncident);
      if (escalation) {
        await db.query(
          `UPDATE incidents SET status = 'escalated' WHERE id = $1`,
          [incidentId]
        );
      }
    }
  }, 60000); // Check after 1 minute
}

async function getIncident(incidentId) {
  const result = await db.query('SELECT * FROM incidents WHERE id = $1', [incidentId]);
  return result.rows[0];
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  return seconds > 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
}

router.get('/incidents', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM incidents 
       ORDER BY created_at DESC 
       LIMIT 50`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/incidents/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM incidents WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/incidents/:id/postmortem', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM postmortems WHERE incident_id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Postmortem not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_incidents,
        COUNT(*) FILTER (WHERE resolved_by = 'automation') as auto_resolved,
        AVG(resolved_at - created_at) FILTER (WHERE resolved_at IS NOT NULL) as avg_mttr,
        COUNT(*) FILTER (WHERE escalated_at IS NOT NULL) as escalated_count
      FROM incidents
      WHERE created_at > $1
    `, [Date.now() - 24 * 60 * 60 * 1000]); // Last 24 hours

    const row = stats.rows[0];
    res.json({
      total_incidents: parseInt(row.total_incidents),
      auto_resolved: parseInt(row.auto_resolved),
      auto_resolution_rate: row.total_incidents > 0 
        ? (row.auto_resolved / row.total_incidents * 100).toFixed(1) 
        : 0,
      avg_mttr_seconds: row.avg_mttr ? Math.floor(row.avg_mttr / 1000) : 0,
      escalated_count: parseInt(row.escalated_count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
