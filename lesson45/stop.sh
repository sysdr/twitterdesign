#!/bin/bash

echo "Stopping Twitter MLOps System..."

# Stop application
pkill -f "node dist/index.js" || true

# Stop Docker services
docker-compose down

echo "System stopped successfully!"
