#!/bin/bash
set -e

echo "🔨 Building Twitter Analytics Pipeline..."

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd ../backend
npm install --legacy-peer-deps

# Build backend
echo "🏗️  Building backend..."
npm run build

echo "✅ Build completed successfully!"

# Start services with Docker
echo "🐳 Starting infrastructure services..."
cd ../docker
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

echo "🎉 Analytics Pipeline built and infrastructure started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "📊 MinIO Console: http://localhost:9001"
