#!/bin/bash

echo "🌍 Starting Regional Monitoring System..."

# Start backend
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start frontend
echo "🌐 Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "🎉 Regional Monitoring System is running!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 API: http://localhost:5000"
echo ""
echo "💡 Try the control panel to simulate regional issues!"
echo "🛑 Press Ctrl+C to stop all services"

# Keep script running and handle cleanup
cleanup() {
  echo ""
  echo "🛑 Stopping services..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  echo "👋 All services stopped"
  exit 0
}

trap cleanup SIGINT SIGTERM

wait
