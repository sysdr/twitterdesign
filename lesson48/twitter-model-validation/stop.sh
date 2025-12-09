#!/bin/bash

echo "Stopping all services..."

# Kill all node processes related to our project
pkill -f "tsx watch src/server.ts" || true
pkill -f "vite" || true

echo "✓ All services stopped"
