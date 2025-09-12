#!/bin/bash
set -e

echo "🎭 Starting replication demo..."

# Start PostgreSQL containers
echo "🐘 Starting PostgreSQL master and slaves..."
docker-compose up -d postgres-master postgres-slave1 postgres-slave2 redis

# Wait for databases to be ready
echo "⏳ Waiting for databases to initialize..."
sleep 30

# Start API server
echo "🚀 Starting API server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

echo "✅ Demo is ready!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔧 API Health: http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop the demo"

# Keep script running
wait $SERVER_PID
