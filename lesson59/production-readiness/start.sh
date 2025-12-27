#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Production Readiness Assessment System..."

# Check if services are already running
if lsof -ti:3000 >/dev/null 2>&1 || lsof -ti:3001 >/dev/null 2>&1; then
    echo "⚠️  Warning: Services may already be running on ports 3000 or 3001"
    echo "Run ./stop.sh first to stop existing services"
    exit 1
fi

# Start backend
echo "Starting backend server..."
if [ ! -d "$SCRIPT_DIR/backend" ]; then
    echo "❌ Error: Backend directory not found at $SCRIPT_DIR/backend"
    exit 1
fi
cd "$SCRIPT_DIR/backend"
npm run dev &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
sleep 5

# Start frontend
echo "Starting frontend..."
if [ ! -d "$SCRIPT_DIR/frontend" ]; then
    echo "❌ Error: Frontend directory not found at $SCRIPT_DIR/frontend"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi
cd "$SCRIPT_DIR/frontend"
BROWSER=none npm start &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

echo ""
echo "✅ System started successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Backend API: http://localhost:3001"
echo "Frontend Dashboard: http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
