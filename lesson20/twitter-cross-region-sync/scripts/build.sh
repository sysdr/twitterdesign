#!/bin/bash

echo "🔨 Building Cross-Region Synchronization System..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run type checking
echo "🔍 Running type checking..."
npx tsc --noEmit

# Run linting
echo "🧹 Running linter..."
npx eslint src --ext .ts,.tsx --fix || echo "⚠️ Linting warnings found"

# Run tests
echo "🧪 Running tests..."
npm test -- --watchAll=false --coverage

# Build for production
echo "🏗️ Building for production..."
npm run build

echo "✅ Build completed successfully!"
