#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting SRE Operations System..."
echo "Working directory: $SCRIPT_DIR"

# Check if docker-compose exists
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo "Error: docker-compose or docker not found"
    exit 1
fi

# Start databases
echo "Starting PostgreSQL and Redis..."
if command -v docker-compose &> /dev/null; then
    docker-compose -f "$SCRIPT_DIR/docker-compose.yml" up -d postgres redis
else
    docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d postgres redis
fi

# Wait for databases
echo "Waiting for databases..."
sleep 8

# Run migrations
echo "Running migrations..."
if [ -f "$SCRIPT_DIR/node_modules/.bin/tsx" ]; then
    "$SCRIPT_DIR/node_modules/.bin/tsx" "$SCRIPT_DIR/scripts/migrate.js" || true
else
    npx tsx "$SCRIPT_DIR/scripts/migrate.js" || true
fi

# Seed data
echo "Seeding engineers..."
if [ -f "$SCRIPT_DIR/node_modules/.bin/tsx" ]; then
    "$SCRIPT_DIR/node_modules/.bin/tsx" "$SCRIPT_DIR/scripts/seedEngineers.js" || true
    "$SCRIPT_DIR/node_modules/.bin/tsx" "$SCRIPT_DIR/scripts/seedRunbooks.js" || true
else
    npx tsx "$SCRIPT_DIR/scripts/seedEngineers.js" || true
    npx tsx "$SCRIPT_DIR/scripts/seedRunbooks.js" || true
fi

# Check for existing processes
if pgrep -f "tsx.*server.ts" > /dev/null; then
    echo "Warning: API server already running, killing existing process..."
    pkill -f "tsx.*server.ts" || true
    sleep 2
fi

if pgrep -f "vite" > /dev/null; then
    echo "Warning: Frontend already running, killing existing process..."
    pkill -f "vite" || true
    sleep 2
fi

# Start API server in background
echo "Starting API server..."
if [ -f "$SCRIPT_DIR/node_modules/.bin/tsx" ]; then
    "$SCRIPT_DIR/node_modules/.bin/tsx" "$SCRIPT_DIR/src/server.ts" &
else
    npx tsx "$SCRIPT_DIR/src/server.ts" &
fi
SERVER_PID=$!

sleep 3

# Start frontend
echo "Starting frontend..."
if [ -f "$SCRIPT_DIR/node_modules/.bin/vite" ]; then
    "$SCRIPT_DIR/node_modules/.bin/vite" &
else
    npm run dev &
fi
FRONTEND_PID=$!

echo "✓ System started!"
echo "  API: http://localhost:8080"
echo "  Dashboard: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop..."

# Wait for interrupt
trap "kill $SERVER_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
