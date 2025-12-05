#!/bin/bash
set -e

echo "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed, skipping..."
fi

echo "Running TypeScript compilation..."
npx tsc --noEmit

echo "Building production bundle..."
npm run build

echo "Running tests..."
npm test

echo "Build completed successfully!"
echo "Run './start.sh' to start the development server"
