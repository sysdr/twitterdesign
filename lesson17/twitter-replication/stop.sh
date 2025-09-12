#!/bin/bash
echo "🛑 Stopping Twitter Master-Slave Replication System..."

# Stop containers
docker-compose down -v

# Kill any remaining processes
pkill -f "node.*server.ts" || true
pkill -f "vite" || true

echo "✅ System stopped successfully!"
