#!/bin/bash

echo "🛑 Stopping Regional Monitoring System..."

# Kill node processes
pkill -f "npm run dev"
pkill -f "npm start"
pkill -f "react-scripts start"

# Stop Docker containers if running
docker-compose down 2>/dev/null

echo "✅ All services stopped"
