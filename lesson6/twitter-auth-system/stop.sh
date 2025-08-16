#!/bin/bash

echo "🛑 Stopping Twitter Authentication System..."

# Kill development servers
pkill -f "npm run dev"
pkill -f "vite"
pkill -f "nodemon"

# Stop Docker services
docker compose down

echo "✅ All services stopped!"
