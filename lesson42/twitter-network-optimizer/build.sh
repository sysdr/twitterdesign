#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "🔨 Building Network Performance Optimizer..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Run TypeScript compiler
echo "🔍 Type checking..."
npx tsc --noEmit

# Build with Vite
echo "📦 Building application..."
npm run build

echo "✅ Build complete!"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "To run tests:"
echo "  npm test"
