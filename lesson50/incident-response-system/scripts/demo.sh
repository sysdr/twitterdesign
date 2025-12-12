#!/bin/bash

echo "=========================================="
echo "Incident Response System - Live Demo"
echo "=========================================="

API="http://localhost:3050/api"

echo ""
echo "Scenario 1: High Error Rate (Auto-Remediation Success)"
echo "─────────────────────────────────────────────────────"
curl -s -X POST "$API/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_name": "high_error_rate",
    "severity": "critical",
    "metrics": {"error_rate": 0.15, "p99_latency": 1200},
    "affected_service": "tweet-service"
  }' | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "Waiting for classification and remediation (10s)..."
sleep 10

echo ""
echo "Scenario 2: Service Crash (Requires Restart)"
echo "─────────────────────────────────────────────────────"
curl -s -X POST "$API/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_name": "service_crash_loop",
    "severity": "high",
    "metrics": {"memory_usage": 0.95, "cpu_usage": 0.2},
    "affected_service": "timeline-service"
  }' | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "Waiting for remediation (10s)..."
sleep 10

echo ""
echo "Scenario 3: Cascading Failure (Complex Remediation)"
echo "─────────────────────────────────────────────────────"
curl -s -X POST "$API/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_name": "cascading_failure_detected",
    "severity": "critical",
    "metrics": {"error_rate": 0.18, "affected_services": 3},
    "affected_service": "api-gateway"
  }' | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "Waiting for complex remediation (15s)..."
sleep 15

echo ""
echo "Current System Metrics:"
echo "─────────────────────────────────────────────────────"
curl -s "$API/metrics" | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "Recent Incidents:"
echo "─────────────────────────────────────────────────────"
curl -s "$API/incidents" | python3 -c "import sys, json; data=json.load(sys.stdin); [print(f\"ID: {i.get('id')}, Alert: {i.get('alert_name')}, Status: {i.get('status')}, Resolved by: {i.get('resolved_by', 'pending')}, Duration: {((i.get('resolved_at') or 0) - i.get('created_at', 0))//1000}s\") for i in data[:5]]" 2>/dev/null || cat

echo ""
echo "=========================================="
echo "✓ Demo Complete!"
echo "=========================================="
echo ""
echo "Open Dashboard: http://localhost:3051"
echo "View detailed incident timelines and metrics"
echo ""
