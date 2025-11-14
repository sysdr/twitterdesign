#!/bin/bash
set -e

echo "=== Building Statistical Performance Optimizer ==="

# Install dependencies
echo "Installing dependencies..."
npm install

# Run tests
echo "Running tests..."
npm test

# Build application
echo "Building application..."
npm run build

echo "=== Build Complete ==="
echo "To start: ./start.sh"
echo "To stop: ./stop.sh"
