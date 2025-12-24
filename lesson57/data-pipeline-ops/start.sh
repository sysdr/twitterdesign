#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Data Pipeline Operations System..."

# Check for duplicate services on port 3001 (backend)
if lsof -ti:3001 > /dev/null 2>&1; then
  echo "⚠️  Port 3001 is already in use. Stopping existing backend..."
  lsof -ti:3001 | xargs kill -9 2>/dev/null || true
  sleep 2
fi

# Check for duplicate services on port 3000 (frontend)
if lsof -ti:3000 > /dev/null 2>&1; then
  echo "⚠️  Port 3000 is already in use. Stopping existing frontend..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 2
fi

# Check for duplicate services on port 5173 (Vite dev server)
if lsof -ti:5173 > /dev/null 2>&1; then
  echo "⚠️  Port 5173 is already in use. Stopping existing Vite server..."
  lsof -ti:5173 | xargs kill -9 2>/dev/null || true
  sleep 2
fi

# Verify backend directory exists
if [ ! -d "backend" ]; then
  echo "❌ Error: backend directory not found. Please run ./build.sh first."
  exit 1
fi

# Verify frontend directory exists
if [ ! -d "frontend" ]; then
  echo "❌ Error: frontend directory not found. Please run ./build.sh first."
  exit 1
fi

# Verify node_modules exist
if [ ! -d "backend/node_modules" ]; then
  echo "❌ Error: Backend dependencies not installed. Please run ./build.sh first."
  exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "❌ Error: Frontend dependencies not installed. Please run ./build.sh first."
  exit 1
fi

# Start backend
echo "Starting backend API..."
cd "$SCRIPT_DIR/backend"
if [ -f "package.json" ]; then
  npm start > "$SCRIPT_DIR/backend.log" 2>&1 &
  BACKEND_PID=$!
  echo "Backend PID: $BACKEND_PID"
  cd "$SCRIPT_DIR"
else
  echo "❌ Error: backend/package.json not found"
  exit 1
fi

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
MAX_WAIT=30
WAIT_COUNT=0
while ! curl -s http://localhost:3001/health > /dev/null 2>&1; do
  if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "❌ Error: Backend failed to start within ${MAX_WAIT} seconds"
    exit 1
  fi
  sleep 1
  WAIT_COUNT=$((WAIT_COUNT + 1))
done
echo "✅ Backend is ready"

# Start frontend
echo "Starting frontend dashboard..."
cd "$SCRIPT_DIR/frontend"
if [ -f "package.json" ]; then
  npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
  FRONTEND_PID=$!
  echo "Frontend PID: $FRONTEND_PID"
  cd "$SCRIPT_DIR"
else
  echo "❌ Error: frontend/package.json not found"
  exit 1
fi

echo ""
echo "✅ System started successfully!"
echo ""
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo ""
echo "Logs:"
echo "  Backend: tail -f $SCRIPT_DIR/backend.log"
echo "  Frontend: tail -f $SCRIPT_DIR/frontend.log"
echo ""
echo "To stop: ./stop.sh"

# Save PIDs
echo "$BACKEND_PID" > "$SCRIPT_DIR/.backend.pid"
echo "$FRONTEND_PID" > "$SCRIPT_DIR/.frontend.pid"
