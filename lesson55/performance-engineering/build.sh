#!/bin/bash

echo "Building Performance Engineering System..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build TypeScript
echo "Compiling TypeScript..."
npx tsc

# Build frontend
echo "Building frontend..."
npx vite build

echo "✅ Build complete!"
