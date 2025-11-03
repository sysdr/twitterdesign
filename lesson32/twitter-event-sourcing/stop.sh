#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🛑 Stopping Twitter Event Sourcing System..."

# Kill backend and frontend processes
if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
    PID=$(cat "$SCRIPT_DIR/.backend.pid")
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID 2>/dev/null || true
        echo "✅ Stopped backend (PID: $PID)"
    fi
    rm "$SCRIPT_DIR/.backend.pid" 2>/dev/null || true
fi

if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
    PID=$(cat "$SCRIPT_DIR/.frontend.pid")
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID 2>/dev/null || true
        echo "✅ Stopped frontend (PID: $PID)"
    fi
    rm "$SCRIPT_DIR/.frontend.pid" 2>/dev/null || true
fi

# Kill any remaining processes on our ports
pkill -f "node.*3001" 2>/dev/null || true
pkill -f "react-scripts.*start" 2>/dev/null || true

# Stop docker services
cd "$SCRIPT_DIR/docker"
if command -v docker-compose &> /dev/null; then
    docker-compose down 2>/dev/null || docker compose down
else
    docker compose down
fi

echo "✅ System stopped successfully!"
