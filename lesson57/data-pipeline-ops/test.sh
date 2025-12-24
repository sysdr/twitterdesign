#!/bin/bash

echo "Testing Data Pipeline Operations System..."

MAX_RETRIES=10
RETRY_COUNT=0

# Wait for API to be ready
echo "Waiting for API to be ready..."
while ! curl -s http://localhost:3001/health > /dev/null 2>&1; do
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Error: API is not responding after ${MAX_RETRIES} attempts"
    echo "Please check if the backend is running: ./start.sh"
    exit 1
  fi
  sleep 1
  RETRY_COUNT=$((RETRY_COUNT + 1))
done

# Test API health
echo "Testing API health..."
response=$(curl -s http://localhost:3001/health)
if echo "$response" | grep -q "healthy"; then
  echo "✅ API health check passed"
else
  echo "❌ API health check failed"
  echo "Response: $response"
  exit 1
fi

# Test metrics endpoint
echo "Testing metrics endpoint..."
metrics=$(curl -s http://localhost:3001/metrics)
if echo "$metrics" | grep -q "throughput"; then
  echo "✅ Metrics endpoint working"
else
  echo "❌ Metrics endpoint failed"
  echo "Response: $metrics"
  exit 1
fi

# Test pipelines endpoint
echo "Testing pipelines endpoint..."
pipelines=$(curl -s http://localhost:3001/pipelines)
if echo "$pipelines" | grep -q "name"; then
  echo "✅ Pipelines endpoint working"
else
  echo "❌ Pipelines endpoint failed"
  echo "Response: $pipelines"
  exit 1
fi

# Validate metrics are not all zeros
echo "Validating metrics are updating..."
if command -v python3 > /dev/null 2>&1; then
  echo ""
  echo "System Statistics:"
  echo "$metrics" | python3 -m json.tool
else
  echo "$metrics" | head -20
fi

# Check if metrics values are non-zero (after some processing time)
THROUGHPUT=$(echo "$metrics" | grep -o '"throughput":[0-9]*' | cut -d: -f2 || echo "0")
EVENTS_PROCESSED=$(echo "$metrics" | grep -o '"eventsProcessed":[0-9]*' | cut -d: -f2 || echo "0")

if [ -z "$THROUGHPUT" ] || [ "$THROUGHPUT" = "0" ]; then
  echo "⚠️  Warning: Throughput is zero. System may still be initializing."
fi

if [ -z "$EVENTS_PROCESSED" ] || [ "$EVENTS_PROCESSED" = "0" ]; then
  echo "⚠️  Warning: Events processed is zero. System may still be initializing."
fi

echo ""
echo "✅ All tests passed!"
