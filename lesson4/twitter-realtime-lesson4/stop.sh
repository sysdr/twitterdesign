#!/bin/bash

echo "🛑 Stopping Twitter Real-Time System..."

# Stop background processes
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    kill $BACKEND_PID 2>/dev/null
    rm .backend.pid
    echo "✅ Backend stopped"
fi

if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null
    rm .frontend.pid
    echo "✅ Frontend stopped"
fi

# Stop Redis if running locally
redis-cli shutdown 2>/dev/null || echo "Redis was not running locally"

# Stop Docker containers
docker-compose down 2>/dev/null

echo "🏁 All services stopped"
