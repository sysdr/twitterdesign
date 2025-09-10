#!/bin/bash

echo "🚀 Starting Cross-Shard Timeline System..."

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Starting Redis..."
    redis-server --daemonize yes
fi

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null; then
    echo "Please ensure PostgreSQL is running on port 5432"
fi

# Start the application
npm run dev &
APP_PID=$!

echo "🌐 System started!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔧 API Endpoints:"
echo "  GET /api/timeline/:userId - Generate timeline"
echo "  GET /api/shards/status - Check shard health"
echo "  GET /api/metrics - Performance metrics"
echo ""
echo "Press Ctrl+C to stop"

# Wait for interrupt
trap "echo 'Stopping system...'; kill $APP_PID; exit" INT
wait $APP_PID
