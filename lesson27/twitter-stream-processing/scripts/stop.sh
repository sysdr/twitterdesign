#!/bin/bash

echo "Stopping all services..."
pkill -f "node dist/index.js" || true
pkill -f "vite" || true
docker-compose down

echo "All services stopped"
