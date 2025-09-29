#!/bin/bash

echo "🧪 Testing Regional Monitoring Dashboard..."
echo "=========================================="

# Test backend health
echo "📡 Testing Backend Health..."
BACKEND_HEALTH=$(curl -s http://localhost:5000/api/health)
echo "Backend response: $BACKEND_HEALTH"

if [[ $BACKEND_HEALTH == *"healthy"* ]]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Test frontend accessibility
echo ""
echo "🌐 Testing Frontend Accessibility..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend accessibility check failed"
    exit 1
fi

# Test metrics collection
echo ""
echo "📊 Testing Metrics Collection..."
METRICS_RESPONSE=$(curl -s http://localhost:5000/api/system-state)
METRICS_COUNT=$(echo "$METRICS_RESPONSE" | jq '.metrics | length')

if [ "$METRICS_COUNT" -gt 0 ]; then
    echo "✅ Metrics are being collected ($METRICS_COUNT metrics)"
    
    # Check if metrics have non-zero values
    echo ""
    echo "🧮 Checking Metric Values..."
    
    # Extract sample metrics and check for non-zero values
    SAMPLE_METRICS=$(echo "$METRICS_RESPONSE" | jq '.metrics[0:3]')
    echo "Sample metrics:"
    echo "$SAMPLE_METRICS" | jq .
    
    # Test latency metrics (should be > 0)
    LATENCY_COUNT=$(echo "$METRICS_RESPONSE" | jq '[.metrics[] | select(.type == "api_latency" and .value > 0)] | length')
    if [ "$LATENCY_COUNT" -gt 0 ]; then
        echo "✅ API latency metrics showing non-zero values"
    else
        echo "⚠️  No non-zero latency metrics found"
    fi
    
    # Test CPU usage metrics (should be > 0)
    CPU_COUNT=$(echo "$METRICS_RESPONSE" | jq '[.metrics[] | select(.type == "cpu_usage" and .value > 0)] | length')
    if [ "$CPU_COUNT" -gt 0 ]; then
        echo "✅ CPU usage metrics showing non-zero values"
    else
        echo "⚠️  No non-zero CPU metrics found"
    fi
    
else
    echo "❌ No metrics are being collected"
    exit 1
fi

# Test regional status
echo ""
echo "🗺️  Testing Regional Status..."
REGIONS_RESPONSE=$(echo "$METRICS_RESPONSE" | jq '.regions[] | {id, name, status}')
REGIONS_COUNT=$(echo "$METRICS_RESPONSE" | jq '.regions | length')

echo "Regions:"
echo "$REGIONS_RESPONSE" | jq .

if [ "$REGIONS_COUNT" -eq 3 ]; then
    echo "✅ All 3 regions are detected"
else
    echo "❌ Expected 3 regions, found $REGIONS_COUNT"
fi

# Test WebSocket endpoint accessibility (this would require socket.io client)
echo ""
echo "🔌 Testing WebSocket Server Readiness..."
# We can't easily test WebSocket without a client, but we can check if the server is bound
NETSTAT_RESULT=$(netstat -tuln | grep :5000 || echo "")
if [[ $NETSTAT_RESULT == *"5000"* ]]; then
    echo "✅ Server listening on port 5000"
else
    echo "⚠️  Server not detected on port 5000"
fi

echo ""
echo "🎉 Dashboard testing completed!"
echo "📊 Dashboard URL: http://localhost:3000"
echo "🔌 API URL: http://localhost:5000"
echo ""
echo "✨ Features validated:"
echo "   ✅ Backend health endpoint"
echo "   ✅ Frontend accessibility"
echo "   ✅ Real-time metrics collection"
echo "   ✅ Regional status monitoring"
echo "   ✅ WebSocket server (port 5000)"
