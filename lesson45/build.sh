#!/bin/bash
set -e

echo "Building Twitter MLOps System..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Compile TypeScript
echo "Compiling TypeScript..."
npm run build

echo "Build completed successfully!"
