#!/bin/bash

echo "🔨 Building Twitter DR System..."

# Backend
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

# Frontend
echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "✅ Build complete!"
