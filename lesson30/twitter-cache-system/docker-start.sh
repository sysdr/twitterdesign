#!/bin/bash

echo "🐳 Starting Advanced Cache System with Docker..."

cd docker
docker-compose up --build

echo "✅ Docker services started!"
echo "🎯 Access the dashboard at: http://localhost:3000"
