#!/bin/bash

echo "🏗️  Building Security Operations Center..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Run TypeScript compilation
echo "Compiling TypeScript..."
npm run build

# Run tests
echo "Running tests..."
npm test

echo "✅ Build completed successfully!"
