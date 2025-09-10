#!/bin/bash

echo "🛑 Stopping Cross-Shard Timeline System..."

# Stop Node.js processes
pkill -f "node.*timeline"
pkill -f "ts-node-dev.*timeline"

# Stop Redis if it was started by our script
if pgrep -x "redis-server" > /dev/null; then
    redis-cli shutdown
fi

echo "✅ System stopped"
