#!/bin/bash

echo "🎯 Running Content Moderation Demo..."

# Wait for services to be ready
echo "Waiting for services..."
sleep 10

# Create demo users and posts
echo "Creating demo data..."
curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is a great post about technology!",
    "userId": "demo-user-1"
  }'

curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Buy now! Amazing offer! Click here!",
    "userId": "demo-user-2"
  }'

curl -X POST http://localhost:3001/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "content": "I hate this stupid platform and everyone on it",
    "userId": "demo-user-3"
  }'

echo "✅ Demo data created!"
echo "🌐 Open http://localhost:3000 to see the moderation dashboard"
echo "📊 Check the analytics and moderation queue"
