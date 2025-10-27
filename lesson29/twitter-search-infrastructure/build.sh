#!/bin/bash
echo "🚀 Building Twitter Search Infrastructure"

# Install backend dependencies
cd backend && npm install
npm run build

# Install frontend dependencies  
cd ../frontend && npm install
npm run build

# Start Docker services
cd ../docker && docker-compose up -d

echo "✅ Build complete! Run ./start.sh to start services"
