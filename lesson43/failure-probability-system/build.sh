#!/bin/bash

echo "Building Failure Probability System..."

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
