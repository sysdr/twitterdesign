#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
npm install

echo "🏗️  Building TypeScript..."
npx tsc --noEmit

echo "📦 Building application..."
npm run build

echo "✅ Build completed successfully!"
