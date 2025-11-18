#!/bin/bash
set -e

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building project..."
npm run build

echo "🧪 Running tests..."
npm run test

echo "✅ Build complete!"
