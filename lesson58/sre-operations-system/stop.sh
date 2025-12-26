#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Stopping SRE Operations System..."

# Stop Node processes
echo "Stopping API server..."
pkill -f "tsx.*server.ts" || pkill -f "node.*server.ts" || true

echo "Stopping frontend..."
pkill -f "vite" || true

sleep 2

# Stop Docker containers
echo "Stopping Docker containers..."
if command -v docker-compose &> /dev/null; then
    docker-compose -f "$SCRIPT_DIR/docker-compose.yml" down
else
    docker compose -f "$SCRIPT_DIR/docker-compose.yml" down
fi

echo "✓ System stopped!"
