#!/bin/bash

echo "🚀 Starting Twitter Geographic Distribution System..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests
echo "🧪 Running tests..."
npm test -- --watchAll=false

# Build the application
echo "🔨 Building application..."
npm run build

# Start the development server
echo "🌐 Starting development server..."
npm start &

# Wait for server to start
sleep 10

echo "✅ System ready!"
echo "🌍 Access the dashboard at: http://localhost:3000"
echo "📊 Monitor regional latencies and traffic routing in real-time"

# Keep script running
wait
