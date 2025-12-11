#!/bin/bash

echo "=========================================="
echo "Building Observability Stack"
echo "=========================================="

echo "Installing dependencies..."
npm install

echo "Compiling TypeScript..."
npm run build

echo "Running tests..."
npm test

echo "Build complete!"
