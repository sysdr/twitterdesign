#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "Stopping Performance Engineering System..."

# Kill processes by PID if files exist
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    rm -f .frontend.pid
fi

# Kill processes on ports as fallback
lsof -ti:3000,4000,4001 | xargs kill -9 2>/dev/null || true

# Kill any remaining node processes related to this project
pkill -f "ts-node-dev.*src/index.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "✅ System stopped"
