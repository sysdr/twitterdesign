#!/bin/bash

echo "🛑 Stopping Twitter Sharding System..."

if [ -f .server.pid ]; then
    kill $(cat .server.pid) 2>/dev/null || true
    rm .server.pid
fi

if [ -f .frontend.pid ]; then
    kill $(cat .frontend.pid) 2>/dev/null || true
    rm .frontend.pid
fi

echo "✅ System stopped"
