#!/bin/bash
set -e

echo "=== Statistical Performance Optimization Demo ==="
echo ""
echo "This demo will:"
echo "1. Start the optimization system"
echo "2. Run automated Bayesian optimization for 30 trials"
echo "3. Show A/B testing of configurations"
echo "4. Display performance improvements in real-time"
echo ""
echo "Press Enter to start..."
read

# Start the system in background
./start.sh &
SYSTEM_PID=$!

# Wait for system to start
echo "Waiting for system to initialize..."
sleep 10

# Open browser
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
fi

echo ""
echo "=== Dashboard opened in browser ==="
echo "Click 'Start Optimization' button to begin"
echo ""
echo "The system will:"
echo "- Test 30 different configurations using Bayesian optimization"
echo "- Run A/B tests to validate improvements"
echo "- Automatically apply validated optimizations"
echo "- Show real-time performance metrics"
echo ""
echo "Expected improvement: ~25% reduction in latency"
echo ""
echo "Press Ctrl+C to stop demo"

wait $SYSTEM_PID
