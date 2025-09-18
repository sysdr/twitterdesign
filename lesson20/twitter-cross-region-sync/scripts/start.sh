#!/bin/bash

echo "🚀 Starting Cross-Region Synchronization System..."

# Check if build exists
if [ ! -d "build" ]; then
    echo "📦 Build not found, building first..."
    ./scripts/build.sh
fi

# Start development server
echo "🌐 Starting development server..."
npm start &

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d redis prometheus

echo "✅ System started!"
echo "🌐 Web interface: http://localhost:3000"
echo "📊 Prometheus metrics: http://localhost:9090"
echo "📋 Redis: localhost:6379"
