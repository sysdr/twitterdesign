#!/bin/bash

echo "🧪 Running tests..."

# Test all services
npm run test:all

# Health check tests
echo "Performing health checks..."

services=("3000" "3002" "3003" "3004" "3005" "3006" "3007")
for port in "${services[@]}"; do
  if curl -s "http://localhost:$port/health" > /dev/null; then
    echo "✅ Service on port $port is healthy"
  else
    echo "❌ Service on port $port is not responding"
  fi
done

echo "🎯 Test completed!"
