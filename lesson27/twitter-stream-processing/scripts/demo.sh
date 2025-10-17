#!/bin/bash

echo "Running Stream Processing Demo..."
echo ""

echo "1. Testing API health..."
curl -s http://localhost:4000/api/health | jq '.'

echo ""
echo "2. Fetching current metrics..."
curl -s http://localhost:4000/api/metrics | jq '.stats'

echo ""
echo "3. Dashboard available at: http://localhost:3000"
echo ""
echo "Demo complete! Check the dashboard for real-time visualization."
