#!/bin/bash
set -e

echo "🔨 Building Twitter CDN Integration..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Linting code..."
npm run lint || true

# Run tests
echo "🧪 Running tests..."
npm test

# Build the application
echo "🏗️  Building application..."
npm run build

echo "✅ Build completed successfully!"
