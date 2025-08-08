#!/bin/bash

echo "🎮 Running Live Demo - Twitter Real-Time Processing"
echo "================================================="

# Wait for services to be ready
sleep 5

echo "📊 Current system stats:"
curl -s http://localhost:8000/api/stats | jq .

echo ""
echo "🐦 Creating sample tweets for demo..."

# Create tweets from different users and capture IDs to avoid cache issues
T1=$(curl -s -X POST http://localhost:8000/api/tweets \
  -H "Content-Type: application/json" \
  -d '{"content": "🚀 Real-time processing is amazing! #WebSocket #RealTime", "authorId": "user1"}')
echo "$T1" | jq .
T1_ID=$(echo "$T1" | jq -r '.tweet.id')

sleep 1

T2=$(curl -s -X POST http://localhost:8000/api/tweets \
  -H "Content-Type: application/json" \
  -d '{"content": "Testing event sourcing patterns 📝 #EventSourcing #Architecture", "authorId": "user2"}')
echo "$T2" | jq .
T2_ID=$(echo "$T2" | jq -r '.tweet.id')

sleep 1

T3=$(curl -s -X POST http://localhost:8000/api/tweets \
  -H "Content-Type: application/json" \
  -d '{"content": "Redis pub/sub is incredibly fast! ⚡ #Redis #Performance", "authorId": "user3"}')
echo "$T3" | jq .
T3_ID=$(echo "$T3" | jq -r '.tweet.id')

echo ""
echo "❤️ Adding some likes to trigger notifications..."
# Have user2 like user1's tweet using captured ID (avoids stale timeline cache)
curl -s -X POST http://localhost:8000/api/tweets/${T1_ID}/like \
  -H "Content-Type: application/json" \
  -d '{"userId": "user2"}' | jq .

echo ""
echo "📊 Updated system stats:"
curl -s http://localhost:8000/api/stats | jq .

echo ""
echo "🎯 Demo completed! Check the frontend at http://localhost:3000"
echo "💡 Open multiple browser tabs to see real-time updates"
echo "🔄 Switch between users to see different timelines"
