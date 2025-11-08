#!/bin/bash

echo "Starting Security at Scale..."

# Start Redis
if ! command -v redis-server &> /dev/null; then
    echo "Starting Redis with Docker..."
    docker run -d --name security-redis -p 6379:6379 redis:7-alpine
else
    redis-server --daemonize yes
fi

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 5

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Services started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM
wait
