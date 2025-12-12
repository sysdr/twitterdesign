#!/bin/bash
set -e

echo "Starting Incident Response System..."

# Start Docker services
echo "Starting PostgreSQL and Redis..."
docker-compose up -d
echo "Waiting for services to be ready..."
sleep 10

# Start backend
echo "Starting backend..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend
echo "Waiting for backend to start..."
sleep 15

# Start frontend
echo "Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "✓ Incident Response System is running!"
echo "=========================================="
echo "Backend API: http://localhost:3050"
echo "Dashboard: http://localhost:3051"
echo "Health Check: http://localhost:3050/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=========================================="

# Wait for interrupt
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; docker-compose down; exit" INT
wait
