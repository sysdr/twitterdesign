#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Auto-Scaling System..."

# Check for duplicate services
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠ Warning: Port 3000 is already in use"
    lsof -i :3000
fi

if lsof -i :4000 > /dev/null 2>&1; then
    echo "⚠ Warning: Port 4000 is already in use"
    lsof -i :4000
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠ Dependencies not installed. Running npm install..."
    npm install --legacy-peer-deps
fi

# Check if required commands exist
if ! command -v node &> /dev/null; then
    echo "❌ Error: node command not found"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm command not found"
    exit 1
fi

# Start API server in background
echo "Starting API server..."
cd "$SCRIPT_DIR"
npm run start:server > /tmp/api_server.log 2>&1 &
API_PID=$!

# Wait for API to start
sleep 3

# Check if API started successfully
if ! kill -0 $API_PID 2>/dev/null; then
    echo "❌ Error: API server failed to start"
    exit 1
fi

# Start frontend
echo "Starting dashboard..."
cd "$SCRIPT_DIR"
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 2

echo ""
echo "✓ System started!"
echo "✓ Dashboard: http://localhost:3000"
echo "✓ API: http://localhost:4000"
echo "✓ API PID: $API_PID"
echo "✓ Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $API_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    pkill -f "node.*src/server.ts" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    echo "✓ All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
