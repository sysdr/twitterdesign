#!/bin/bash
set -e

echo "🚀 Starting Twitter Caching System..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
mkdir -p logs

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Start Redis in background
echo "🔴 Starting Redis..."
redis-server --daemonize yes --port 6379

# Wait for Redis to start
sleep 2

echo "✅ Starting application..."
npm start &
APP_PID=$!

echo "🌐 Application started at http://localhost:3000"
echo "📊 Dashboard: http://localhost:3000"
echo "📈 Metrics: http://localhost:3000/metrics"
echo "🔧 Cache Stats: http://localhost:3000/api/cache/stats"
echo ""
echo "💡 Try these commands:"
echo "curl http://localhost:3000/api/users/user1/timeline"
echo "curl http://localhost:3000/api/trending"
echo "curl http://localhost:3000/api/cache/stats"

# Keep script running
wait $APP_PID
