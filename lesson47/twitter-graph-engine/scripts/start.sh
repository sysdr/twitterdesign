#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "Starting Graph Engine..."
echo "Project directory: $PROJECT_DIR"

# Check if directories exist
if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: Backend directory not found: $BACKEND_DIR"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Error: Frontend directory not found: $FRONTEND_DIR"
  exit 1
fi

# Check if node_modules exist
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo "Error: Backend dependencies not installed. Run ./scripts/build.sh first"
  exit 1
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Error: Frontend dependencies not installed. Run ./scripts/build.sh first"
  exit 1
fi

# Check for existing processes on ports
if lsof -i :3047 >/dev/null 2>&1; then
  echo "Warning: Port 3047 is already in use. Stopping existing process..."
  pkill -f "tsx watch.*server.ts" || true
  sleep 2
fi

if lsof -i :5173 >/dev/null 2>&1; then
  echo "Warning: Port 5173 is already in use. Stopping existing process..."
  pkill -f "vite.*$FRONTEND_DIR" || true
  sleep 2
fi

# Start backend
echo "Starting backend server..."
cd "$BACKEND_DIR"
npm run dev > /tmp/graph-engine-backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "Starting frontend server..."
cd "$FRONTEND_DIR"
npm run dev > /tmp/graph-engine-frontend.log 2>&1 &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID (logs: /tmp/graph-engine-backend.log)"
echo "Frontend PID: $FRONTEND_PID (logs: /tmp/graph-engine-frontend.log)"
echo ""
echo "Services starting..."
echo "Backend: http://localhost:3047"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
