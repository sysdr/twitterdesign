#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "===================================="
echo "Chaos Engineering Demo"
echo "===================================="

echo "Starting services..."
./start.sh &
SERVICES_PID=$!

# Wait for services to start
sleep 10

echo ""
echo "✅ Demo is ready!"
echo ""
echo "📊 Open http://localhost:3000 in your browser"
echo ""
echo "Demo features:"
echo "1. Real-time system health monitoring"
echo "2. Multiple chaos experiment types"
echo "3. Automatic safety thresholds"
echo "4. Live metrics visualization"
echo ""
echo "Try these experiments:"
echo "- Service Unavailability Test (safe, 10% traffic)"
echo "- Database Latency Injection (shows recovery time)"
echo "- Cache Failure (demonstrates fallback to database)"
echo ""
echo "Press Ctrl+C to stop demo"

trap "kill $SERVICES_PID 2>/dev/null; ./stop.sh" INT
wait
