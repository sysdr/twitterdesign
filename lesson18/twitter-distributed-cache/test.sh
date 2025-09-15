#!/bin/bash

echo "🧪 Running tests for Distributed Caching System..."

# Backend tests
echo "🔍 Running backend tests..."
cd backend
npm test
cd ..

# Frontend tests (if applicable)
echo "🔍 Running frontend tests..."
cd frontend
npm run lint
cd ..

echo "✅ All tests completed!"
