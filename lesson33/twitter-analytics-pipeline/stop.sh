#!/bin/bash

echo "🛑 Stopping Twitter Analytics Pipeline..."

# Kill Node.js processes
pkill -f "react-scripts start" || true
pkill -f "ts-node src/server.ts" || true

# Stop Docker services
cd docker
docker-compose down

echo "✅ Analytics Pipeline stopped"
