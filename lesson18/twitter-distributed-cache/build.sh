#!/bin/bash

echo "🏗️  Building Distributed Caching System..."

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

echo "✅ Build completed successfully!"
echo ""
echo "🚀 Next steps:"
echo "1. Start Redis cluster: docker-compose -f docker/docker-compose.yml up -d"
echo "2. Start backend: cd backend && npm start"
echo "3. Start frontend: cd frontend && npm run dev"
echo "4. Access dashboard: http://localhost:3000"
