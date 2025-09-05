#!/bin/bash
set -e

echo "🐳 Starting Twitter Load Balancer with Docker..."

# Build and start services
docker-compose up --build -d

echo "✅ Services started successfully!"
echo "📊 Load Balancer Dashboard: http://localhost:3000"
echo "🛑 Run './stop-docker.sh' to stop services"
