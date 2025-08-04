#!/bin/bash

echo "🚀 Starting Twitter Tweet Storage System..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Kill any existing processes
echo "🔄 Cleaning up existing processes..."
pkill -f "tsx src/api/server.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Start the API server in background
echo "🖥️ Starting API server on port 3001..."
npm run server &
API_PID=$!

# Wait for API server to start
sleep 3

# Start the frontend development server
echo "⚛️ Starting React development server on port 3000..."
npm run dev &
FRONTEND_PID=$!

echo "✅ System started successfully!"
echo "📊 Frontend: http://localhost:3000"
echo "🔧 API: http://localhost:3001"
echo "🏥 Health Check: http://localhost:3001/health"

echo ""
echo "🎯 Performance Targets:"
echo "  - Response Time: < 100ms"
echo "  - Throughput: 100+ tweets/second"
echo "  - Availability: 99.9%"

echo ""
echo "PIDs - API: $API_PID, Frontend: $FRONTEND_PID"
echo "💡 Use 'npm run stop' or './scripts/stop.sh' to stop all services"

# Save PIDs for cleanup
echo $API_PID > .api.pid
echo $FRONTEND_PID > .frontend.pid

# Wait for user input to keep script running
echo ""
echo "✋ Press Ctrl+C to stop all services"
wait
