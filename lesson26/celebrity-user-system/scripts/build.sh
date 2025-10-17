#!/bin/bash

echo "🏗️ Building Celebrity User Architecture System..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests
echo "🧪 Running tests..."
npm test

# Build project
echo "🔨 Building project..."
npm run build

echo "✅ Build completed successfully!"
