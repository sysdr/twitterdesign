#!/bin/bash

echo "🛑 Stopping Twitter Timeline System..."

cd docker
docker-compose down -v

echo "✅ All services stopped and volumes removed"
