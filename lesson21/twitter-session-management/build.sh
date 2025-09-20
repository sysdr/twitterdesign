#!/bin/bash

echo "🔨 Building Twitter Session Management System..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
npm run build
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Build complete!"
