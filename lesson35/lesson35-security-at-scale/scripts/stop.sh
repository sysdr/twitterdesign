#!/bin/bash

echo "Stopping Security at Scale..."

# Stop processes
pkill -f "tsx watch src/server.ts"
pkill -f "vite"

# Stop Redis if running in Docker
docker stop security-redis 2>/dev/null
docker rm security-redis 2>/dev/null

echo "✅ Services stopped!"
