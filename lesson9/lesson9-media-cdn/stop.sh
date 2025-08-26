#!/bin/bash

echo "🛑 Stopping Twitter Media CDN System..."

# Kill backend and frontend processes
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    kill $BACKEND_PID 2>/dev/null || true
    rm backend.pid
fi

if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    kill $FRONTEND_PID 2>/dev/null || true
    rm frontend.pid
fi

# Stop Docker containers
docker-compose down

echo "✅ System stopped successfully!"
