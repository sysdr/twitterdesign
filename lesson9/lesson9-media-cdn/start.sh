#!/bin/bash

echo "🚀 Starting Twitter Media CDN System..."

# Stop any existing containers
docker-compose down

# Create necessary directories
mkdir -p docker/volumes/{localstack,mongodb,redis,cdn}

# Start infrastructure services
echo "🐳 Starting infrastructure services..."
docker-compose up -d localstack mongodb redis

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 15

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --legacy-peer-deps
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps
cd ..

# Start backend in development mode
echo "🔧 Starting backend service..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 8

# Start frontend in development mode
echo "🎨 Starting frontend service..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Start CDN simulator
echo "🌐 Starting CDN simulator..."
docker-compose up -d cdn-simulator

# Store PIDs for cleanup
echo $BACKEND_PID > backend.pid
echo $FRONTEND_PID > frontend.pid

echo "✅ System started successfully!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "🌐 CDN Simulator: http://localhost:8080"
echo "🗄️  MongoDB: localhost:27017"
echo "🎯 Redis: localhost:6379"
echo "☁️  LocalStack: http://localhost:4566"
echo ""
echo "🧪 Run tests with: npm test"
echo "🛑 Stop with: ./stop.sh"
