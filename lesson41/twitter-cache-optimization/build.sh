#!/bin/bash
echo "Building Twitter Cache Optimization System..."
echo "=========================================="

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run TypeScript compilation
echo "🔨 Compiling TypeScript..."
npm run build

echo "✅ Build complete!"
echo ""
echo "To start the system:"
echo "  npm run dev    - Development mode with auto-reload"
echo "  npm start      - Production mode"
echo "  npm test       - Run tests"
echo "  npm run demo   - Run interactive demo"

