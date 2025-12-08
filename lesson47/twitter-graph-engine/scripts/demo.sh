#!/bin/bash

echo "========================================="
echo "Graph Algorithm Engine - Demo"
echo "========================================="

# Wait for backend to be ready
sleep 3

echo ""
echo "1. Generating scale-free graph (1000 nodes)..."
RESPONSE1=$(curl -X POST http://localhost:3047/api/graph/generate \
  -H "Content-Type: application/json" \
  -d '{"type":"scale-free","nodeCount":1000,"avgDegree":10}' \
  -s)
echo "$RESPONSE1" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE1"

sleep 2

echo ""
echo "2. Detecting communities with Label Propagation..."
RESPONSE2=$(curl -X POST http://localhost:3047/api/analysis/communities \
  -s)
echo "$RESPONSE2" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE2"

sleep 2

echo ""
echo "3. Computing PageRank..."
RESPONSE3=$(curl -X POST http://localhost:3047/api/analysis/pagerank \
  -H "Content-Type: application/json" \
  -d '{"personalized":false}' \
  -s)
echo "$RESPONSE3" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE3"

sleep 2

echo ""
echo "4. Partitioning graph into 4 shards..."
RESPONSE4=$(curl -X POST http://localhost:3047/api/analysis/partition \
  -H "Content-Type: application/json" \
  -d '{"numPartitions":4,"method":"hash"}' \
  -s)
echo "$RESPONSE4" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE4"

echo ""
echo "========================================="
echo "Demo complete!"
echo "Open http://localhost:5174 to see the dashboard (or check logs for actual port)"
echo "========================================="
