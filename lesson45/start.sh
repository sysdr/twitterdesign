#!/bin/bash
set -e

echo "Starting Twitter MLOps System..."

# Start Docker services
echo "Starting Redis and PostgreSQL..."
docker-compose up -d

# Wait for services
echo "Waiting for services to be ready..."
sleep 5

# Start application
echo "Starting MLOps application..."
npm start
