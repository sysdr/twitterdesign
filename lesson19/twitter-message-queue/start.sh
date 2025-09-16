#!/bin/bash

echo "🚀 Starting Twitter Message Queue System..."
echo "==========================================="

# Start infrastructure if not already running
if ! docker-compose ps | grep -q "Up"; then
    echo "🐳 Starting Docker services..."
    docker-compose up -d
    sleep 15
fi

# Start backend
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend
echo "🎨 Starting frontend development server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ All services started successfully!"
echo ""
echo "🔗 Access URLs:"
echo "   📱 Frontend:  http://localhost:3000"
echo "   🔧 Backend:   http://localhost:3001"
echo "   📊 Kafka UI:  http://localhost:8080"
echo "   📈 Health:    http://localhost:3001/health"
echo ""
echo "📊 To run load test:"
echo "   node tests/load/load-test.js"
echo ""
echo "🛑 To stop all services, run: ./stop.sh"

# Keep track of PIDs for cleanup
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Wait for user interrupt
trap 'echo "Stopping services..."; ./stop.sh; exit 0' INT
wait
