#!/bin/bash

echo "🎬 Twitter Caching System Demo"
echo "================================"

BASE_URL="http://localhost:3000"

echo ""
echo "1. Testing cache miss (first request)..."
time curl -s "$BASE_URL/api/users/user1/timeline" | jq '.data.cached'

echo ""
echo "2. Testing cache hit (second request)..."
time curl -s "$BASE_URL/api/users/user1/timeline" | jq '.data.cached'

echo ""
echo "3. Creating new tweet (invalidates cache)..."
curl -s -X POST "$BASE_URL/api/tweets" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","content":"Demo tweet for cache invalidation test","mediaUrls":[]}' \
  | jq '.success'

echo ""
echo "4. Testing cache miss after invalidation..."
time curl -s "$BASE_URL/api/users/user1/timeline" | jq '.data.cached'

echo ""
echo "5. Cache statistics:"
curl -s "$BASE_URL/api/cache/stats" | jq '.data.overall'

echo ""
echo "6. Trending topics (cached):"
curl -s "$BASE_URL/api/trending" | jq '.data.topics'

echo ""
echo "📊 Open http://localhost:3000 in browser for interactive dashboard"
