#!/bin/bash
set -e

echo "🚀 Starting Twitter Analytics Pipeline..."

# Start infrastructure services
cd docker
docker compose up -d
cd ..

# Start backend
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend
echo "🌐 Starting frontend..."
cd frontend
npm start &
FRONTEND_PID=$!

echo "Analytics Pipeline started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
wait $BACKEND_PID $FRONTEND_PID
