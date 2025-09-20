#!/bin/bash

echo "🧪 Running tests..."

# Backend tests
echo "🔧 Running backend tests..."
cd backend
npm test
cd ..

# Frontend tests
echo "⚛️ Running frontend tests..."
cd frontend
npm test -- --coverage --watchAll=false
cd ..

echo "✅ Tests complete!"
