#!/bin/bash

echo "Stopping Observability Stack..."

pkill -f "node dist/index.js"
docker-compose down

echo "All services stopped."
