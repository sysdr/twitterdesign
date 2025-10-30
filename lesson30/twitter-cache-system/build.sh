#!/bin/bash

echo "🏗️  Building Advanced Cache System..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Type check
echo "🔍 Type checking..."
npx tsc --noEmit

# Run tests
echo "🧪 Running tests..."
npm test

# Build application
echo "🏭 Building application..."
npm run build

# Build Docker image
echo "🐳 Building Docker image..."
cd docker && docker-compose build

echo "✅ Build completed successfully!"
echo ""
echo "Next steps:"
echo "  npm run start    # Start backend server"
echo "  npm run dev      # Start frontend development server"
echo "  ./start.sh       # Start both frontend and backend"
echo "  ./docker-start.sh # Start with Docker"
