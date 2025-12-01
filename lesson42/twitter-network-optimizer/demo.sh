#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "🎬 Network Performance Optimizer Demo"
echo "======================================"
echo ""

echo "This demo showcases:"
echo "1. TCP Optimization - Adaptive configuration based on network conditions"
echo "2. Bandwidth Allocation - Weighted fair queuing for different traffic types"
echo "3. Performance Prediction - Mathematical latency modeling"
echo "4. Real-time Monitoring - Live performance metrics and visualization"
echo ""

echo "The application will:"
echo "- Simulate various network conditions (fiber, mobile, congested)"
echo "- Show latency reduction of 30%+ through optimization"
echo "- Display real-time metrics: P50, P95, P99 latency"
echo "- Demonstrate bandwidth allocation across traffic classes"
echo "- Adapt TCP parameters automatically"
echo ""

echo "Opening browser in 3 seconds..."
sleep 3

# Open browser
if command -v xdg-open > /dev/null; then
  xdg-open http://localhost:3000
elif command -v open > /dev/null; then
  open http://localhost:3000
fi

echo ""
echo "✅ Demo ready at http://localhost:3000"
echo ""
echo "Click 'Start Simulation' to begin generating traffic"
echo "Watch the metrics update in real-time!"
