#!/bin/bash

echo "🚀 Starting Twitter Microservices..."

# Start infrastructure services
echo "Starting MongoDB and Consul..."
docker-compose -f docker/docker-compose.yml up -d

# Wait for services to be ready
echo "Waiting for services to initialize..."
sleep 10

# Start all microservices
echo "Starting all services..."
npm run dev &

echo "✅ All services started!"
echo ""
echo "Services running on:"
echo "- Frontend Dashboard: http://localhost:3001"
echo "- API Gateway: http://localhost:3000"
echo "- Consul UI: http://localhost:8500"
echo ""
echo "Press Ctrl+C to stop all services"

wait
