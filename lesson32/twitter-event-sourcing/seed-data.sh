#!/bin/bash

API_URL="http://localhost:3001"

echo "🌱 Seeding Twitter Event Sourcing data..."

# Create users
echo "👥 Creating users..."
USER1=$(curl -s -X POST "$API_URL/api/commands/users" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_001","username":"alice_dev","email":"alice@example.com","displayName":"Alice Developer"}')

USER2=$(curl -s -X POST "$API_URL/api/commands/users" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_002","username":"bob_coder","email":"bob@example.com","displayName":"Bob Coder"}')

USER3=$(curl -s -X POST "$API_URL/api/commands/users" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_003","username":"charlie_tech","email":"charlie@example.com","displayName":"Charlie Tech"}')

echo "✅ Users created"
sleep 2

# Create tweets
echo "🐦 Creating tweets..."
curl -s -X POST "$API_URL/api/commands/tweets" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_001","content":"Just started exploring event sourcing! It'\''s fascinating how we can rebuild state from events. #EventSourcing #CQRS"}' > /dev/null

curl -s -X POST "$API_URL/api/commands/tweets" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_002","content":"Building a Twitter-like system with event sourcing. The architecture is so clean! 🚀"}' > /dev/null

curl -s -X POST "$API_URL/api/commands/tweets" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_001","content":"Event store patterns are game-changers for auditability and time-travel debugging."}' > /dev/null

curl -s -X POST "$API_URL/api/commands/tweets" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_003","content":"Learning about projections and read models. The separation of write and read models is brilliant!"}' > /dev/null

curl -s -X POST "$API_URL/api/commands/tweets" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_002","content":"Command handlers, event handlers, and projections - the CQRS trifecta! 💪"}' > /dev/null

echo "✅ Tweets created"

sleep 2

echo ""
echo "📊 Data Summary:"
echo "Users:"
curl -s "$API_URL/api/users" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/api/users"

echo ""
echo "Tweets:"
curl -s "$API_URL/api/tweets" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/api/tweets"

echo ""
echo "Events:"
EVENT_COUNT=$(curl -s "$API_URL/api/events?limit=100" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "N/A")
echo "Total events: $EVENT_COUNT"

echo ""
echo "✅ Seeding complete!"
