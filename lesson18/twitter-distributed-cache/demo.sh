#!/bin/bash

echo "🎬 Running Distributed Cache Demo..."

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Test cache operations
echo "🔥 Testing cache operations..."

# Set some test data
curl -X POST http://localhost:8000/api/cache \
  -H "Content-Type: application/json" \
  -d '{"key": "demo:user:1", "value": {"id": 1, "name": "Alice", "followers": 15000}}'

curl -X POST http://localhost:8000/api/cache \
  -H "Content-Type: application/json" \
  -d '{"key": "demo:tweet:123", "value": {"id": 123, "content": "Distributed caching is awesome!", "likes": 500}}'

# Get data
echo "📊 Getting cached data..."
curl http://localhost:8000/api/cache/demo:user:1
echo ""
curl http://localhost:8000/api/cache/demo:tweet:123
echo ""

# Get stats
echo "📈 Getting cache statistics..."
curl http://localhost:8000/api/cache/stats/overview
echo ""

echo "🎉 Demo completed! Check the dashboard at http://localhost:3000"
