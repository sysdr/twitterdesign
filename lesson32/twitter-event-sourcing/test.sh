#!/bin/bash
set -e

echo "🧪 Running Integration Tests..."

# Backend tests
echo "🔍 Running backend tests..."
cd backend
npm test

cd ..

# Frontend tests
echo "⚛️  Running frontend tests..."
npm test -- --coverage --watchAll=false

# API integration tests
echo "🔌 Testing API endpoints..."
if curl -s http://localhost:3001/health | grep -q "healthy"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# Test user creation
USER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/commands/users \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "username": "testuser",
    "email": "test@example.com"
  }')

if echo "$USER_RESPONSE" | grep -q "success"; then
    echo "✅ User creation test passed"
else
    echo "❌ User creation test failed"
    exit 1
fi

echo "🎉 All tests passed!"
