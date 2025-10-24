#!/bin/bash

echo "🚀 Starting Content Moderation System..."

# Start database and Redis (if not running)
docker-compose up -d postgres redis

# Wait for services
sleep 5

# Start ML service
cd ml-service
source venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8001 &
ML_PID=$!
cd ..

# Start backend
cd backend
DB_PORT=5433 DB_PASSWORD=password npm start &
BACKEND_PID=$!
cd ..

# Start frontend
cd frontend
BROWSER=none npm start &
FRONTEND_PID=$!
cd ..

echo "✅ All services started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:3001"
echo "🤖 ML Service: http://localhost:8001"

# Store PIDs for stop script
echo $ML_PID > .ml_pid
echo $BACKEND_PID > .backend_pid
echo $FRONTEND_PID > .frontend_pid
