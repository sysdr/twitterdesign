#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Building TypeScript..."
npm run build

echo "Build complete!"
