#!/bin/bash

echo "========================================="
echo "Twitter DR Automation - Live Demo"
echo "========================================="
echo ""

API_URL="http://localhost:3001/api"

echo "1. Testing Health Checks..."
curl -s "$API_URL/health" | head -20
echo ""
sleep 2

echo "2. Creating Full Backup..."
curl -s -X POST "$API_URL/backup/full" | head -10
echo ""
sleep 2

echo "3. Checking Backup Stats..."
curl -s "$API_URL/backup/stats"
echo ""
sleep 2

echo "4. Initiating DR Test..."
curl -s -X POST "$API_URL/dr-test/run" | head -20
echo ""
sleep 15

echo "5. Checking DR Test Results..."
curl -s "$API_URL/dr-test/history" | head -30
echo ""

echo ""
echo "========================================="
echo "Demo Complete!"
echo "Open http://localhost:3000 for full dashboard"
echo "========================================="
