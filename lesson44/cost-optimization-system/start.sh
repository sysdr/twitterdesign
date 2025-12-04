#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Cost Optimization System..."
echo ""

# Start backend server
echo "1. Starting backend server..."
if [ ! -f "$SCRIPT_DIR/server/index.js" ]; then
  echo "   ✗ Error: server/index.js not found at $SCRIPT_DIR/server/index.js"
  exit 1
fi
node "$SCRIPT_DIR/server/index.js" &
BACKEND_PID=$!
echo "   ✓ Backend running (PID: $BACKEND_PID)"
echo ""

# Wait for backend
sleep 3

# Start frontend
echo "2. Starting frontend..."
if [ ! -f "$SCRIPT_DIR/package.json" ]; then
  echo "   ✗ Error: package.json not found at $SCRIPT_DIR/package.json"
  exit 1
fi
cd "$SCRIPT_DIR" && npm run dev &
FRONTEND_PID=$!
echo "   ✓ Frontend running (PID: $FRONTEND_PID)"
echo ""

echo "System started successfully!"
echo ""
echo "Backend:  http://localhost:4000"
echo "Frontend: http://localhost:3000"
echo "WebSocket: ws://localhost:4000/ws"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Save PIDs
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Wait for Ctrl+C
wait
