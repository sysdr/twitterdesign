#!/bin/bash

echo "🎭 Testing Demo Functionality..."
echo "================================"

# Simulate different levels of issues and monitor the response
echo "🎯 Simulating Regional Issues..."

# Test scenario 1: Minor issue in US East
echo ""
echo "📊 Test 1: Minor Issue in US East"
curl -X POST http://localhost:5000/api/simulate-issue \
  -H "Content-Type: application/json" \
  -d '{"regionIndex": 0, "severity": "minor"}' | jq .

echo "Waiting for metrics to update..."
sleep 8

CURRENT_STATE=$(curl -s http://localhost:5000/api/system-state)
echo "Current regional status:"
echo "$CURRENT_STATE" | jq '.regions[] | select(.id == "us-east") | {id, name, status}'

# Test scenario 2: Major issue in Europe
echo ""
echo "📊 Test 2: Major Issue in Europe"
curl -X POST http://localhost:5000/api/simulate-issue \
  -H "Content-Type: application/json" \
  -d '{"regionIndex": 1, "severity": "major"}' | jq .

echo "Waiting for metrics to update..."
sleep 8

CURRENT_STATE=$(curl -s http://localhost:5000/api/system-state)
echo "Current regional status:"
echo "$CURRENT_STATE" | jq '.regions[] | select(.id == "europe") | {id, name, status}'

# Test scenario 3: Major issue in Asia Pacific
echo ""
echo "📊 Test 3: Major Issue in Asia Pacific"
curl -X POST http://localhost:5000/api/simulate-issue \
  -H "Content-Type: application/json" \
  -d '{"regionIndex": 2, "severity": "major"}' | jq .

echo "Waiting for metrics to update..."
sleep 8

CURRENT_STATE=$(curl -s http://localhost:5000/api/system-state)
echo "Current regional status:"
echo "$CURRENT_STATE" | jq '.regions[] | select(.id == "asia-pacific") | {id, name, status}'

# Check for alerts
echo ""
echo "🚨 Checking for Active Alerts..."
ALERTS=$(curl -s http://localhost:5000/api/alerts)
ALERTS_COUNT=$(echo "$ALERTS" | jq '. | length')

echo "Active alerts count: $ALERTS_COUNT"
if [ "$ALERTS_COUNT" -gt 0 ]; then
    echo "✅ Alerts generated!"
    echo "$ALERTS" | jq '.[] | {severity, title, description}'
else
    echo "ℹ️  No alerts generated (thresholds might need adjustment)"
fi

# Test reset functionality
echo ""
echo "🔄 Testing Reset Functionality..."
curl -X POST http://localhost:5000/api/reset-regions | jq .

echo "Waiting for reset to take effect..."
sleep 5

FINAL_STATE=$(curl -s http://localhost:5000/api/system-state)
echo "Final regional status:"
echo "$FINAL_STATE" | jq '.regions[] | {id, name, status}'

echo ""
echo "📈 Dashboard Metrics Summary:"
echo "$FINAL_STATE" | jq '{
  globalStatus,
  regionsCount: (.regions | length),
  metricsCount: (.metrics | length),
  activeAlertsCount: (.activeAlerts | length)
}'

echo ""
echo "🌍 Demo test completed!"
echo "📊 Visit http://localhost:3000 to see the real-time dashboard"
echo "🔌 API endpoints available at http://localhost:5000/api/"
