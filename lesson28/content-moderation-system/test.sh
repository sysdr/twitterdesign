#!/bin/bash

echo "🧪 Running tests..."

# Backend tests
echo "Testing backend..."
cd backend
npm test
cd ..

# Frontend tests
echo "Testing frontend..."
cd frontend
npm test -- --coverage --watchAll=false
cd ..

# ML service tests
echo "Testing ML service..."
cd ml-service
source venv/bin/activate
python -m pytest tests/ -v
cd ..

# Integration tests
echo "Running integration tests..."
cd tests/integration
npm test
cd ../..

echo "✅ All tests completed!"
