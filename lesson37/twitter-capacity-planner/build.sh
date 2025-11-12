#!/bin/bash

echo "Installing dependencies..."
npm install

echo "Running type check..."
npx tsc --noEmit

echo "Running tests..."
npm test

echo "Building application..."
npm run build

echo "Build complete!"
