#!/bin/bash

echo "🚀 Starting Distributed Caching System..."

# Start Redis cluster and monitoring
echo "🔥 Starting Redis cluster and monitoring..."
docker-compose -f docker/docker-compose.yml up -d

# Wait for Redis to be ready
echo "⏳ Waiting for Redis cluster to be ready..."
sleep 10

# Start backend in background
echo "🖥️  Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Start frontend in background
echo "🌐 Starting frontend development server..."
cd frontend  
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 System is starting up!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔧 API: http://localhost:8000"
echo "📈 Metrics: http://localhost:9090"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "🛑 Shutting down..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose -f docker/docker-compose.yml down; exit' INT

wait
