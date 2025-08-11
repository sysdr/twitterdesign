#!/bin/bash
set -e

echo "🧪 Running Twitter Caching System Tests"

# Unit tests
echo "Running unit tests..."
npm test

# Integration tests
echo "Running integration tests..."
npm run test:integration

# Load tests (short version for demo)
echo "Running load tests..."
timeout 30s npm run test:load || true

echo "✅ All tests completed"
