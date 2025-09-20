#!/bin/bash

echo "🎬 Running Session Management Demo..."

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Test backend health
echo "🔍 Testing backend health..."
curl -s http://localhost:3001/health | jq '.'

# Test authentication
echo "🔐 Testing authentication..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@twitter.com","password":"password123","region":"us-east"}')

echo "Auth Response: $AUTH_RESPONSE"

ACCESS_TOKEN=$(echo $AUTH_RESPONSE | jq -r '.accessToken')

# Test session info
echo "📊 Testing session info..."
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3001/api/session/info | jq '.'

# Test session stats
echo "📈 Testing session stats..."
curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3001/api/session/stats | jq '.'

echo "✅ Demo complete!"
echo "🌐 Open http://localhost:3000 to see the UI"
