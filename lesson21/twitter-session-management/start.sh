#!/bin/bash

echo "🚀 Starting Twitter Session Management System..."

# Start Redis cluster in background
echo "🔴 Starting Redis cluster..."
redis-server redis-cluster/node-1/redis.conf --daemonize yes
redis-server redis-cluster/node-2/redis.conf --daemonize yes
redis-server redis-cluster/node-3/redis.conf --daemonize yes

sleep 3

# Create Redis cluster
echo "🔗 Creating Redis cluster..."
redis-cli --cluster create localhost:7000 localhost:7001 localhost:7002 --cluster-replicas 0 --cluster-yes

# Start backend
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

sleep 5

# Start frontend
echo "⚛️ Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ System started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo "🔴 Redis Cluster: localhost:7000,7001,7002"

# Save PIDs for stop script
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

wait
