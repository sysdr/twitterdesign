#!/bin/bash
set -e

echo "🚀 Starting Twitter API with Rate Limiting"
echo "=========================================="

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install global tools
echo "🔧 Installing global tools..."
npm install -g tsx k6

# Start Redis (if not running in Docker)
if ! docker ps | grep -q redis; then
  echo "🔴 Starting Redis..."
  docker run -d --name redis-twitter -p 6379:6379 redis:7-alpine || echo "Redis might already be running"
  sleep 3
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

# Start the server
echo "🌟 Starting server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test the API
echo "✅ Testing API endpoints..."
curl -s http://localhost:3000/api/health | jq '.'
curl -s http://localhost:3000/api/info | jq '.'
curl -s http://localhost:3000/api/v1/tweets | jq '.data | length'

echo ""
echo "🎉 Success! API is running at:"
echo "   Health: http://localhost:3000/api/health"
echo "   Info: http://localhost:3000/api/info"
echo "   V1 Tweets: http://localhost:3000/api/v1/tweets"
echo "   V2 Tweets: http://localhost:3000/api/v2/tweets"
echo ""
echo "📊 Load test command: npm run test:load"
echo "🛑 Stop server: npm run stop or ./stop.sh"

# Save PID for stop script
echo $SERVER_PID > .server.pid
