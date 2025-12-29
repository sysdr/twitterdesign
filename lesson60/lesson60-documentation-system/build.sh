#!/bin/bash

echo "========================================="
echo "Building Documentation System"
echo "========================================="

# Install dependencies
echo "Installing dependencies..."
npm install

# Run tests
echo "Running tests..."
npm test

# Build production bundle
echo "Building production bundle..."
npm run build

# Generate documentation
echo "Generating documentation..."
npm run docs:generate

# Verify runbooks
echo "Verifying runbooks..."
npm run docs:verify

echo ""
echo "✅ Build complete!"
echo "Run 'npm start' to launch the dashboard"
