#!/bin/bash

echo "🔨 Building Twitter Microservices..."

# Install root dependencies
npm install

# Install all service dependencies
npm run install:all

# Build all services
npm run build:all

echo "✅ Build completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start MongoDB and Consul: docker-compose -f docker/docker-compose.yml up -d"
echo "2. Start all services: ./start.sh"
echo "3. Open http://localhost:3001 to view the dashboard"
