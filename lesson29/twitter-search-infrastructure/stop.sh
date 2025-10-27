#!/bin/bash
echo "🛑 Stopping Twitter Search Infrastructure"

# Stop Node processes
pkill -f "node.*server.js"
pkill -f "react-scripts"

# Stop Docker services
cd docker && docker-compose down

echo "✅ All services stopped"
