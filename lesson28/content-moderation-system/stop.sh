#!/bin/bash

echo "🛑 Stopping Content Moderation System..."

# Kill services
if [ -f .ml_pid ]; then
  kill $(cat .ml_pid) 2>/dev/null
  rm .ml_pid
fi

if [ -f .backend_pid ]; then
  kill $(cat .backend_pid) 2>/dev/null
  rm .backend_pid
fi

if [ -f .frontend_pid ]; then
  kill $(cat .frontend_pid) 2>/dev/null
  rm .frontend_pid
fi

# Stop Docker services
docker-compose down

echo "✅ All services stopped!"
