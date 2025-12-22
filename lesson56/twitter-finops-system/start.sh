#!/bin/bash

echo "Starting Twitter FinOps System..."

# Start API server in background
echo "Starting API server..."
npm run dev:api &
API_PID=$!

# Wait for API to be ready
sleep 3

# Start UI
echo "Starting dashboard UI..."
npm run dev:ui &
UI_PID=$!

echo ""
echo "====================================="
echo "Twitter FinOps System Running"
echo "====================================="
echo "API Server: http://localhost:4000"
echo "Dashboard:  http://localhost:3000"
echo "====================================="
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait $API_PID $UI_PID
