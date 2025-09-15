#!/bin/bash

echo "🛑 Stopping Distributed Caching System..."

# Kill Node.js processes
pkill -f "node.*dist/index.js" 2>/dev/null
pkill -f "npm.*dev" 2>/dev/null

# Stop Docker containers
docker-compose -f docker/docker-compose.yml down

echo "✅ All services stopped!"
