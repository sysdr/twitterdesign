#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "Starting Performance Engineering System..."
echo "Working directory: $SCRIPT_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Error: node_modules not found. Please run npm install first."
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found."
    exit 1
fi

# Check for duplicate services
echo "Checking for existing services..."
if lsof -ti:3000,4000,4001 >/dev/null 2>&1; then
    echo "Warning: Ports 3000, 4000, or 4001 are already in use"
    lsof -ti:3000,4000,4001 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start backend in background
echo "Starting backend server on port 4000..."
if [ -f "node_modules/.bin/ts-node-dev" ]; then
    node_modules/.bin/ts-node-dev --respawn src/index.ts > backend.log 2>&1 &
elif [ -f "node_modules/ts-node-dev/lib/bin.js" ]; then
    node node_modules/ts-node-dev/lib/bin.js --respawn src/index.ts > backend.log 2>&1 &
else
    npx ts-node-dev --respawn src/index.ts > backend.log 2>&1 &
fi
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend server on port 3000..."
if [ -f "node_modules/.bin/vite" ]; then
    node_modules/.bin/vite > frontend.log 2>&1 &
elif [ -f "node_modules/vite/bin/vite.js" ]; then
    node node_modules/vite/bin/vite.js > frontend.log 2>&1 &
else
    npx vite > frontend.log 2>&1 &
fi
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Save PIDs to file for later cleanup
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo ""
echo "Services started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Access points:"
echo "  Dashboard: http://localhost:3000"
echo "  API:       http://localhost:4000"
echo "  WebSocket: ws://localhost:4001"
echo ""
echo "Logs:"
echo "  Backend:  tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "To stop: ./stop.sh"
