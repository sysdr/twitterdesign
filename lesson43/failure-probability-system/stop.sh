#!/bin/bash

echo "Stopping all Failure Probability System processes..."
pkill -f "tsx.*src/(index|demo)\.ts" || true
pkill -f "node.*dist/index.js" || true
pkill -f "tsx watch src/index.ts" || true

# Wait a moment for processes to stop
sleep 1

# Force kill if still running
if lsof -i :3000 > /dev/null 2>&1; then
    echo "Force killing processes on port 3000..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
fi

echo "✓ All processes stopped"
