#!/bin/bash

echo "Building Twitter FinOps System..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Compile TypeScript
echo "Compiling TypeScript..."
npm run build

echo "Build complete!"
