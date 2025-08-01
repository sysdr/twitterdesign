#!/bin/bash

echo "🛑 Stopping Twitter Data Modeling System..."

# Kill processes using saved PIDs
if [ -f backend.pid ]; then
    kill $(cat backend.pid) 2>/dev/null || true
    rm backend.pid
fi

if [ -f frontend.pid ]; then
    kill $(cat frontend.pid) 2>/dev/null || true
    rm frontend.pid
fi

# Kill any remaining processes on the ports
kill $(lsof -ti:3000) 2>/dev/null || true
kill $(lsof -ti:3001) 2>/dev/null || true

echo "✅ All services stopped"
