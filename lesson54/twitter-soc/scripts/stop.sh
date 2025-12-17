#!/bin/bash

echo "🛑 Stopping Security Operations Center..."

# Kill Node processes
pkill -f "ts-node"
pkill -f "node dist/index.js"

# Stop Docker containers
docker-compose down

echo "✅ SOC stopped"
