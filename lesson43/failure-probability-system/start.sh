#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR" || exit 1

# Check for duplicate services
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use. Stopping existing services..."
    pkill -f "tsx.*src/index.ts" || true
    pkill -f "tsx.*src/demo.ts" || true
    pkill -f "node.*dist/index.js" || true
    sleep 2
fi

# Check for running processes
if pgrep -f "tsx.*src/(index|demo)\.ts" > /dev/null; then
    echo "⚠️  Found running failure-probability processes. Stopping them..."
    pkill -f "tsx.*src/(index|demo)\.ts"
    sleep 2
fi

echo "Starting Failure Probability System..."
npm run dev &
echo "✓ System started on http://localhost:3000"
