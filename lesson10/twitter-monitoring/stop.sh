#!/bin/bash

echo "🛑 Stopping Twitter Clone Monitoring Stack..."

# Stop React app
if [ -f .react.pid ]; then
  kill $(cat .react.pid) 2>/dev/null
  rm .react.pid
fi

# Stop metrics server
if [ -f .metrics.pid ]; then
  kill $(cat .metrics.pid) 2>/dev/null
  rm .metrics.pid
fi

# Stop Docker services
cd docker && docker-compose down && cd ..

echo "✅ All services stopped!"
