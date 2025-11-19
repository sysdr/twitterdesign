#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Running tests..."
npm test

echo "Building application..."
npm run build

echo "Build complete! Run 'npm start' to launch."
