#!/bin/bash
set -e

echo "🚀 Starting Twitter Sharding System..."

# Start API server in background
npm run server &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Start frontend
npm run dev &
FRONTEND_PID=$!

echo "📊 API Server running on http://localhost:8080"
echo "🌐 Frontend running on http://localhost:3000"
echo "🔧 Server PID: $SERVER_PID"
echo "🔧 Frontend PID: $FRONTEND_PID"

# Save PIDs for stop script
echo $SERVER_PID > .server.pid
echo $FRONTEND_PID > .frontend.pid

wait
