import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3050/api';

async function runTests() {
  console.log('\n========================================');
  console.log('Running Incident Response System Tests');
  console.log('========================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Health Check
  try {
    console.log('Test 1: Health Check');
    const res = await fetch('http://localhost:3050/health');
    const data = await res.json();
    if (data.status === 'healthy') {
      console.log('✓ PASS: System is healthy\n');
      testsPassed++;
    } else {
      throw new Error('System not healthy');
    }
  } catch (error) {
    console.error('✗ FAIL:', error.message, '\n');
    testsFailed++;
  }

  // Test 2: Create Incident - High Error Rate
  try {
    console.log('Test 2: Create Incident - High Error Rate');
    const res = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert_name: 'high_error_rate',
        severity: 'critical',
        metrics: { error_rate: 0.15, p99_latency: 1200 },
        affected_service: 'tweet-service'
      })
    });
    const data = await res.json();
    if (data.incident_id && data.status === 'created') {
      console.log(`✓ PASS: Incident ${data.incident_id} created\n`);
      testsPassed++;
      
      // Wait for classification and remediation
      console.log('Waiting for auto-remediation...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Check if resolved
      const incidentRes = await fetch(`${API_BASE}/incidents/${data.incident_id}`);
      const incident = await incidentRes.json();
      console.log(`Status: ${incident.status}, Resolved by: ${incident.resolved_by || 'pending'}\n`);
    } else {
      throw new Error('Failed to create incident');
    }
  } catch (error) {
    console.error('✗ FAIL:', error.message, '\n');
    testsFailed++;
  }

  // Test 3: Create Incident - Database Issue
  try {
    console.log('Test 3: Create Incident - Database Connection Exhaustion');
    const res = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert_name: 'database_connection_pool_exhausted',
        severity: 'high',
        metrics: { error_rate: 0.18, cpu_usage: 0.85 },
        affected_service: 'user-service'
      })
    });
    const data = await res.json();
    if (data.incident_id) {
      console.log(`✓ PASS: Incident ${data.incident_id} created\n`);
      testsPassed++;
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const incidentRes = await fetch(`${API_BASE}/incidents/${data.incident_id}`);
      const incident = await incidentRes.json();
      console.log(`Status: ${incident.status}, Type: ${incident.incident_type || 'classifying'}\n`);
    }
  } catch (error) {
    console.error('✗ FAIL:', error.message, '\n');
    testsFailed++;
  }

  // Test 4: Metrics Endpoint
  try {
    console.log('Test 4: System Metrics');
    const res = await fetch(`${API_BASE}/metrics`);
    const metrics = await res.json();
    console.log(`Total Incidents: ${metrics.total_incidents}`);
    console.log(`Auto-Resolved: ${metrics.auto_resolved} (${metrics.auto_resolution_rate}%)`);
    console.log(`Avg MTTR: ${metrics.avg_mttr_seconds}s`);
    console.log(`Escalated: ${metrics.escalated_count}`);
    console.log('✓ PASS: Metrics retrieved\n');
    testsPassed++;
  } catch (error) {
    console.error('✗ FAIL:', error.message, '\n');
    testsFailed++;
  }

  // Test 5: List All Incidents
  try {
    console.log('Test 5: List All Incidents');
    const res = await fetch(`${API_BASE}/incidents`);
    const incidents = await res.json();
    console.log(`✓ PASS: Retrieved ${incidents.length} incidents\n`);
    testsPassed++;
  } catch (error) {
    console.error('✗ FAIL:', error.message, '\n');
    testsFailed++;
  }

  console.log('========================================');
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log('========================================\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests().catch(console.error);
