#!/bin/bash

set -e

ENVIRONMENT=${1:-blue}
TIMEOUT=${2:-300}

compose() {
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    docker compose "$@"
  fi
}

echo "🚀 Starting Blue-Green deployment to $ENVIRONMENT environment"

# Function to check health
check_health() {
    local port=$1
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:$port/api/health > /dev/null 2>&1; then
            echo "✅ Health check passed on port $port"
            return 0
        fi
        echo "⏳ Attempt $attempt/$max_attempts: Waiting for service to be healthy..."
        sleep 10
        ((attempt++))
    done
    
    echo "❌ Health check failed after $max_attempts attempts"
    return 1
}

# Deploy to specified environment
if [ "$ENVIRONMENT" = "blue" ]; then
    echo "🔵 Deploying to Blue environment..."
    compose up -d --build frontend-blue backend-blue postgres-blue redis-blue
    
    echo "⏳ Waiting for Blue environment to be ready..."
    sleep 30
    
    if check_health 5001; then
        echo "🔄 Switching traffic to Blue environment..."
        # Update nginx configuration to route to blue
        sed -i 's/server backend-green:5000 weight=1;/server backend-green:5000 weight=0 backup;/' infrastructure/nginx/nginx.conf
        sed -i 's/server backend-blue:5000 weight=0 backup;/server backend-blue:5000 weight=1;/' infrastructure/nginx/nginx.conf
        compose restart nginx-lb
        echo "✅ Traffic switched to Blue environment"
    else
        echo "❌ Blue environment health check failed"
        exit 1
    fi
    
elif [ "$ENVIRONMENT" = "green" ]; then
    echo "🟢 Deploying to Green environment..."
    compose up -d --build frontend-green backend-green postgres-green redis-green
    
    echo "⏳ Waiting for Green environment to be ready..."
    sleep 30
    
    if check_health 5002; then
        echo "🔄 Switching traffic to Green environment..."
        # Update nginx configuration to route to green
        sed -i 's/server backend-blue:5000 weight=1;/server backend-blue:5000 weight=0 backup;/' infrastructure/nginx/nginx.conf
        sed -i 's/server backend-green:5000 weight=0 backup;/server backend-green:5000 weight=1;/' infrastructure/nginx/nginx.conf
        compose restart nginx-lb
        echo "✅ Traffic switched to Green environment"
    else
        echo "❌ Green environment health check failed"
        exit 1
    fi
fi

echo "🎉 Deployment completed successfully!"
