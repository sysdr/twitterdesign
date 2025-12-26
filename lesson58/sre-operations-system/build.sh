#!/bin/bash
set -e

echo "Building SRE Operations System..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build TypeScript
echo "Building TypeScript..."
npm run build

echo "✓ Build complete!"
