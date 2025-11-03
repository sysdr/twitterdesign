#!/bin/bash

echo "🎬 Running Analytics Pipeline Demo..."

echo "1. Starting services..."
./start.sh &
sleep 45

echo "2. Testing analytics endpoints..."
curl -s http://localhost:3001/api/analytics/metrics | jq '.'
curl -s http://localhost:3001/api/analytics/trending | jq '.'

echo "3. Generating sample data..."
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/test/generate-events
  sleep 2
done

echo "4. Dashboard available at: http://localhost:3000"
echo "5. Real-time metrics updating every 5 seconds"
echo "6. Demo completed! Analytics pipeline processing data..."
