#!/bin/bash
echo "🔨 Building Multi-Region Load Testing Dashboard..."

# Install dependencies
npm install

# Run tests
npm test

# Build application
npm run build

echo "✅ Build completed successfully!"
