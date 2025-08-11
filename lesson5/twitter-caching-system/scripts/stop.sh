#!/bin/bash

echo "🛑 Stopping Twitter Caching System..."

# Stop application
pkill -f "node.*server.js" || true
pkill -f "ts-node.*server.ts" || true

# Stop Redis
redis-cli shutdown || true

echo "✅ All services stopped"
