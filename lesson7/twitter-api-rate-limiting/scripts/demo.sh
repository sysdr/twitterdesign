#!/bin/bash

echo "🎭 Twitter API Demo"
echo "=================="

BASE_URL="http://localhost:3000/api"

echo ""
echo "1. Health Check:"
curl -s "$BASE_URL/health" | jq '.'

echo ""
echo "2. API Info:"
curl -s "$BASE_URL/info" | jq '.features'

echo ""
echo "3. Get V1 Tweets:"
curl -s "$BASE_URL/v1/tweets" | jq '.data[0]'

echo ""
echo "4. Get V2 Tweets (with reactions):"
curl -s "$BASE_URL/v2/tweets" | jq '.data[0].reactions'

echo ""
echo "5. Create Tweet (V1) - needs authentication:"
TOKEN=$(node -e "console.log(require('jsonwebtoken').sign({userId:'1'}, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'))")
curl -s -X POST "$BASE_URL/v1/tweets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from API demo! 🚀"}' | jq '.'

echo ""
echo "6. Rate Limiting Test:"
echo "Making 5 quick requests to see rate limiting..."
for i in {1..5}; do
  RESPONSE=$(curl -s -w "HTTP_%{http_code}" "$BASE_URL/v1/tweets")
  echo "Request $i: $(echo $RESPONSE | grep -o 'HTTP_[0-9]*')"
done

echo ""
echo "✨ Demo complete!"
