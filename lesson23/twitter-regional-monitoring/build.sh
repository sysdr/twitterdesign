#!/bin/bash

echo "🚀 Building Regional Monitoring System..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Build backend
echo "🔨 Building backend..."
cd backend
npm run build
cd ..

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

echo "✅ Build completed successfully!"

# Run tests
echo "🧪 Running tests..."
cd backend
npm test
cd ..

echo "✅ All tests passed!"

# Docker build
echo "🐳 Building Docker images..."
docker-compose build

echo "🎉 Regional Monitoring System built successfully!"
