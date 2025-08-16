#!/bin/bash

echo "🚀 Starting Twitter Authentication System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start database services
echo "📊 Starting database services..."
docker compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for databases to be ready..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker compose exec -T postgres pg_isready -U twitter_user -d twitter_auth > /dev/null 2>&1 && \
       docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Databases are ready!"
        break
    fi
    sleep 2
    timeout=$((timeout-2))
done

if [ $timeout -le 0 ]; then
    echo "❌ Databases failed to start within timeout"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build backend
echo "🔨 Building backend..."
cd backend && npm run build && cd ..

# Start services
echo "🌟 Starting development servers..."
export DATABASE_URL="postgresql://twitter_user:twitter_pass@localhost:5432/twitter_auth"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET=""
export JWT_EXPIRES_IN="24h"
export PORT="3001"
export NODE_ENV="development"
export CORS_ORIGIN="http://localhost:3000"

npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

echo "✅ Twitter Authentication System is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo "📊 Health check: http://localhost:3001/api/health"

echo "📋 Press Ctrl+C to stop all services"
wait $BACKEND_PID
