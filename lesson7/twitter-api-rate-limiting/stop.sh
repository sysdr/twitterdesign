#!/bin/bash

echo "🛑 Stopping Twitter API server..."

# Kill server if PID file exists
if [ -f .server.pid ]; then
  PID=$(cat .server.pid)
  if ps -p $PID > /dev/null; then
    kill $PID
    echo "✅ Server stopped (PID: $PID)"
  else
    echo "⚠️  Server was not running"
  fi
  rm .server.pid
fi

# Stop Redis container
if docker ps | grep -q redis-twitter; then
  docker stop redis-twitter
  docker rm redis-twitter
  echo "✅ Redis stopped"
fi

echo "🏁 All services stopped"
