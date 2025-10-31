#!/bin/bash

echo "🛑 Stopping Twitter Microservices..."

# Stop all Node.js processes
pkill -f "npm run dev" || true
pkill -f "ts-node-dev" || true
pkill -f "node dist/server.js" || true

# Stop Docker services
docker-compose -f docker/docker-compose.yml down

echo "✅ All services stopped!"
