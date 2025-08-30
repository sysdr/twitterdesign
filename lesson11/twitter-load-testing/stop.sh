#!/bin/bash

echo "🛑 Stopping Twitter Load Testing services..."

if [ -f .server.pid ]; then
    SERVER_PID=$(cat .server.pid)
    echo "Stopping backend server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null || echo "Backend server already stopped"
    rm .server.pid
fi

if [ -f .vite.pid ]; then
    VITE_PID=$(cat .vite.pid)
    echo "Stopping React app (PID: $VITE_PID)..."
    kill $VITE_PID 2>/dev/null || echo "React app already stopped"
    rm .vite.pid
fi

echo "✅ All services stopped"
