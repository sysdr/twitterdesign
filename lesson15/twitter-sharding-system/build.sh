#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
npm install

echo "🏗️  Building TypeScript..."
npm run build

echo "🧪 Running tests..."
npm test

echo "✅ Build completed successfully!"
