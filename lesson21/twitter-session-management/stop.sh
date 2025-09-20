#!/bin/bash

echo "🛑 Stopping Twitter Session Management System..."

# Stop frontend and backend
if [ -f .backend.pid ]; then
    kill $(cat .backend.pid) 2>/dev/null
    rm .backend.pid
fi

if [ -f .frontend.pid ]; then
    kill $(cat .frontend.pid) 2>/dev/null
    rm .frontend.pid
fi

# Stop Redis cluster
redis-cli -p 7000 shutdown nosave 2>/dev/null
redis-cli -p 7001 shutdown nosave 2>/dev/null
redis-cli -p 7002 shutdown nosave 2>/dev/null

echo "✅ System stopped!"
