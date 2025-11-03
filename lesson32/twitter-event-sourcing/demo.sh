#!/bin/bash
set -e

echo "🎭 Running Event Sourcing Demo..."

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
while ! curl -s http://localhost:3001/health > /dev/null; do
    sleep 1
done

echo "✅ API is ready!"

# Create demo users
echo "👥 Creating demo users..."
curl -X POST http://localhost:3001/api/commands/users \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_alice",
    "username": "alice",
    "email": "alice@twitter.com",
    "displayName": "Alice Johnson"
  }'

curl -X POST http://localhost:3001/api/commands/users \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_bob",
    "username": "bob",
    "email": "bob@twitter.com",
    "displayName": "Bob Smith"
  }'

sleep 2

# Create demo tweets
echo "📝 Creating demo tweets..."
curl -X POST http://localhost:3001/api/commands/tweets \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_alice",
    "content": "Hello World! This is my first tweet using Event Sourcing! 🎉 #EventSourcing #CQRS"
  }'

curl -X POST http://localhost:3001/api/commands/tweets \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_bob",
    "content": "Learning about @alice'\''s event sourcing implementation. Very cool! #SystemDesign"
  }'

curl -X POST http://localhost:3001/api/commands/tweets \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_alice",
    "content": "The complete audit trail is amazing - we can replay any state! 🔄 #TimeTravel"
  }'

echo ""
echo "✅ Demo data created successfully!"
echo "📊 Visit http://localhost:3000 to see the dashboard"
echo "🔍 Check the Events tab to see the complete audit trail"
echo "📈 View Analytics tab for event activity over time"
