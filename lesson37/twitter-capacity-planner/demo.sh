#!/bin/bash

echo "========================================="
echo "Queuing Theory Capacity Planner Demo"
echo "========================================="

echo ""
echo "Starting development server..."
npm run dev &
SERVER_PID=$!

echo ""
echo "Waiting for server to start..."
sleep 5

echo ""
echo "========================================="
echo "Demo Running!"
echo "========================================="
echo ""
echo "Open your browser to: http://localhost:3000"
echo ""
echo "What you'll see:"
echo "1. Three queue systems (Tweet Ingestion, Fanout, Timeline)"
echo "2. Real-time metrics: λ (arrival rate), μ (service rate), ρ (utilization)"
echo "3. Live charts showing utilization and queue depth"
echo "4. Automatic scaling recommendations based on queuing theory"
echo ""
echo "Try different traffic patterns:"
echo "- Steady: Normal load (utilization ~60-70%)"
echo "- Spike: Sudden traffic increase (watch auto-scaling)"
echo "- Growing: Gradual load increase (predictive scaling)"
echo "- Declining: Decreasing load (scale-down recommendations)"
echo ""
echo "Press Ctrl+C to stop the demo"
echo ""

wait $SERVER_PID
