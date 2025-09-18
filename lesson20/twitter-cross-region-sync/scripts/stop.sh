#!/bin/bash

echo "🛑 Stopping Cross-Region Synchronization System..."

# Stop React dev server
pkill -f "react-scripts start" || echo "React dev server not running"

# Stop Docker services
docker-compose down

# Clean up any remaining processes
pkill -f "node.*cross-region" || echo "No remaining processes"

echo "✅ System stopped!"
