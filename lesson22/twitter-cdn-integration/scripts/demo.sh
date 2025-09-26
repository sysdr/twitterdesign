#!/bin/bash

echo "🎬 Running CDN Integration Demo..."

# Start services
./scripts/start.sh &
sleep 10

echo "📊 CDN Dashboard Demo:"
echo "1. Open http://localhost:3001 in your browser"
echo "2. Switch between Dashboard and Analytics tabs"
echo "3. Observe real-time CDN metrics"

echo ""
echo "🧪 Testing CDN functionality:"

# Test content caching
echo "📝 Testing content caching..."
curl -s "http://localhost:8000/api/content/tweet/123" | jq .
echo ""

# Test cache hit
echo "🎯 Testing cache hit..."
curl -s -I "http://localhost:8000/api/content/tweet/123" | grep "X-Cache"
echo ""

# Test cache invalidation
echo "🔄 Testing cache invalidation..."
curl -s -X POST "http://localhost:8000/api/cdn/invalidate" \
  -H "Content-Type: application/json" \
  -d '{"type": "tweet", "id": "123"}' | jq .
echo ""

# Test metrics
echo "📈 Testing metrics endpoint..."
curl -s "http://localhost:8000/api/cdn/metrics" | jq .
echo ""

echo "✅ Demo completed! Check the dashboard for real-time metrics."
