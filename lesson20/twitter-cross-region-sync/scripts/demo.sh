#!/bin/bash

echo "🎭 Running Cross-Region Synchronization Demo..."

# Ensure system is built and running
./scripts/build.sh
./scripts/start.sh

echo "⏳ Waiting for system to start..."
sleep 5

# Run automated demo tests
echo "🤖 Running automated demo scenarios..."

# Test basic replication
echo "📤 Testing basic replication..."
curl -X POST http://localhost:3000/api/demo/create-tweet \
  -H "Content-Type: application/json" \
  -d '{"content":"Demo tweet for replication test"}' || echo "Demo API not implemented yet"

# Test conflict resolution
echo "⚔️ Testing conflict resolution..."
curl -X POST http://localhost:3000/api/demo/create-conflict \
  -H "Content-Type: application/json" \
  -d '{"type":"concurrent_update"}' || echo "Demo API not implemented yet"

# Test network partition
echo "🌐 Testing network partition simulation..."
curl -X POST http://localhost:3000/api/demo/simulate-partition \
  -H "Content-Type: application/json" \
  -d '{"region":"eu-west","duration":5000}' || echo "Demo API not implemented yet"

echo "✅ Demo completed!"
echo "🌐 Visit http://localhost:3000 to see the dashboard"
echo "📊 Monitor metrics at http://localhost:9090"
