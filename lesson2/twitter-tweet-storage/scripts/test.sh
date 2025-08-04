#!/bin/bash

echo "🧪 Running Tweet Storage System Tests..."

echo "📋 Running unit tests..."
npm test

echo ""
echo "🔧 Running integration tests..."
# Start API server for integration tests
npm run server &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test API endpoints
echo "Testing API health..."
curl -s http://localhost:3001/health | jq .

echo ""
echo "Testing tweet creation..."
curl -s -X POST http://localhost:3001/api/tweets \
  -H "Content-Type: application/json" \
  -d '{"content":"Test tweet from automation","authorId":"test-user","authorUsername":"test_user"}' | jq .

echo ""
echo "Testing tweet retrieval..."
curl -s http://localhost:3001/api/tweets | jq .

echo ""
echo "Testing system stats..."
curl -s http://localhost:3001/api/tweets/system/stats | jq .

# Cleanup
kill $SERVER_PID 2>/dev/null

echo ""
echo "✅ Integration tests completed"
