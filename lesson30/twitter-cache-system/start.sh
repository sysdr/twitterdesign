#!/bin/bash

echo "🚀 Starting Advanced Cache System..."

# Prevent duplicate services
pkill -f "vite" >/dev/null 2>&1 || true
pkill -f "server/index" >/dev/null 2>&1 || true

# Start backend server
echo "🖥️  Starting backend server on port 8080..."
npm run start &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Start frontend development server
echo "🌐 Starting frontend development server on port 3000..."
npm run dev &
CLIENT_PID=$!

echo "✅ System started successfully!"
echo ""
echo "🎯 Access the dashboard at: http://localhost:3000"
echo "📊 API endpoints available at: http://localhost:8080/api"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt signal
trap 'echo "🛑 Stopping services..."; kill $SERVER_PID $CLIENT_PID; exit 0' INT
wait
