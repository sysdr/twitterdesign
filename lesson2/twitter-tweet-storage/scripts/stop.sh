#!/bin/bash

echo "🛑 Stopping Twitter Tweet Storage System..."

# Kill processes by PID if files exist
if [ -f ".api.pid" ]; then
    API_PID=$(cat .api.pid)
    kill $API_PID 2>/dev/null && echo "🔥 Stopped API server (PID: $API_PID)"
    rm .api.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    kill $FRONTEND_PID 2>/dev/null && echo "🔥 Stopped frontend server (PID: $FRONTEND_PID)"
    rm .frontend.pid
fi

# Fallback: kill by process name
pkill -f "tsx src/api/server.ts" 2>/dev/null && echo "🔥 Stopped API server"
pkill -f "vite" 2>/dev/null && echo "🔥 Stopped frontend server"

echo "✅ All services stopped"
