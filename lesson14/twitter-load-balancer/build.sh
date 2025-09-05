#!/bin/bash
set -e

echo "🏗️ Building Twitter Load Balancer..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Skip linting for now (TypeScript files need proper parser)
echo "🔍 Skipping linting (TypeScript parser not configured)..."

# Run tests
echo "🧪 Running unit tests..."
npm run test

# Build the application
echo "🏗️ Building application..."
npm run build

echo "✅ Build completed successfully!"
echo "🚀 Run './start.sh' to start the application"
