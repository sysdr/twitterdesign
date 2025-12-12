#!/bin/bash

echo "Stopping Incident Response System..."
pkill -f "node.*server.js" || true
pkill -f "vite" || true
docker-compose down

echo "✓ All services stopped"
