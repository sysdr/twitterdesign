#!/bin/bash

echo "🔨 Building Cross-Shard Timeline System..."

# Install dependencies
npm install

# Setup databases
echo "🗄️ Setting up sharded databases..."
npm run build
node dist/database/setup.js

# Run tests
echo "🧪 Running tests..."
npm test

echo "✅ Build complete!"
echo "Run './start.sh' to start the system"
