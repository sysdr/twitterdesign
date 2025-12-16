#!/bin/bash

echo "Stopping Auto-Scaling System..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Kill processes more specifically
pkill -f "node.*src/server.ts" 2>/dev/null
pkill -f "vite" 2>/dev/null

# Also kill by port if still running
if lsof -i :3000 > /dev/null 2>&1; then
    lsof -ti :3000 | xargs kill -9 2>/dev/null
fi

if lsof -i :4000 > /dev/null 2>&1; then
    lsof -ti :4000 | xargs kill -9 2>/dev/null
fi

echo "✓ All services stopped"
