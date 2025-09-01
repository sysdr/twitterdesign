#!/bin/bash

set -e

echo "🧪 Running integration tests..."

# Test health endpoints with retries
test_endpoint() {
    local url=$1
    local name=$2
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f --max-time 10 "$url" >/dev/null 2>&1; then
            echo "✅ $name health check passed"
            return 0
        fi
        echo "⏳ Attempt $attempt/$max_attempts: $name not ready yet..."
        sleep 5
        ((attempt++))
    done
    
    echo "❌ $name health check failed after $max_attempts attempts"
    return 1
}

# Test health endpoints
test_endpoint "http://localhost:5001/api/health" "Blue environment"
test_endpoint "http://localhost:5002/api/health" "Green environment"
test_endpoint "http://localhost:80/health" "Load balancer"
test_endpoint "http://localhost:80/api/health" "API through load balancer"

echo "✅ All integration tests passed!"
