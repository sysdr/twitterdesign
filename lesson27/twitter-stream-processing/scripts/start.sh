#!/bin/bash
set -e

echo "Starting Kafka infrastructure..."
docker-compose up -d

echo "Waiting for Kafka to be ready..."
sleep 15

echo "Starting stream processors..."
npm start &
PROCESSOR_PID=$!

echo "Starting dashboard..."
npm run dashboard &
DASHBOARD_PID=$!

echo ""
echo "=================================================="
echo "Stream Processing System Started!"
echo "=================================================="
echo "Dashboard: http://localhost:3000"
echo "API: http://localhost:4000"
echo "Kafka: localhost:9092"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

wait
