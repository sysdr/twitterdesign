#!/bin/bash

echo "🛑 Stopping Twitter CDN Integration..."

# Stop all Node.js processes
pkill -f "node.*twitter-cdn" || true
pkill -f "npm.*dev" || true

# Stop Redis if running
redis-cli shutdown || true

echo "✅ All services stopped!"
