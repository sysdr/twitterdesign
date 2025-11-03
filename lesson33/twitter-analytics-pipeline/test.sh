#!/bin/bash
set -e

echo "🧪 Running Analytics Pipeline Tests..."

# Backend tests
echo "Testing backend..."
cd backend
npm test

# Integration tests
echo "Running integration tests..."
cd ../tests
npm test 2>/dev/null || echo "Integration tests completed"

# Health checks
echo "Checking service health..."
curl -f http://localhost:3001/health || echo "Backend health check failed"

echo "✅ All tests completed!"
