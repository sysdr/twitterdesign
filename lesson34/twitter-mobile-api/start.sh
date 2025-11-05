#!/bin/bash

set -e

echo "========================================="
echo "Starting Mobile API Services"
echo "========================================="

# Start backend
echo "Starting backend..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 5

# Start frontend
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "========================================="
echo "Services started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo "========================================="

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
