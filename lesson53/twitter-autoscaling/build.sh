#!/bin/bash

echo "Building Capacity Planning & Auto-Scaling System..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Run tests
echo "Running tests..."
npm test

# Build TypeScript
echo "Building TypeScript..."
npm run build

echo "✓ Build complete!"
echo ""
echo "Next steps:"
echo "1. Run: ./start.sh"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Open http://localhost:4000/api/health to verify API"
