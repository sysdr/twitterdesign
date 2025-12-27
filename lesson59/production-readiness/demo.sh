#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Production Readiness Assessment System Demo"
echo "==========================================="
echo ""

# Check if services are running
if ! lsof -ti:3001 >/dev/null 2>&1; then
    echo "Starting services..."
    "$SCRIPT_DIR/start.sh" &
    START_PID=$!
    sleep 10
else
    echo "Services already running"
fi

echo ""
echo "🚀 Running demonstration..."
echo ""

# Trigger assessment via API
echo "1. Running production readiness assessment..."
curl -s -X POST http://localhost:3001/api/assessment/run > /dev/null
sleep 3

echo "2. Fetching assessment results..."
curl -s http://localhost:3001/api/assessment/latest | jq '.' 2>/dev/null || echo "Assessment completed"

echo ""
echo "3. Generating report..."
curl -s http://localhost:3001/api/assessment/report

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Demo complete!"
echo ""
echo "Visit http://localhost:3000 to see the full dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
