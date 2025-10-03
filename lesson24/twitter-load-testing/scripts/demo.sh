#!/bin/bash

echo "🎯 Running Multi-Region Load Testing Demo..."
echo ""
echo "📊 Dashboard is available at: http://localhost:3000"
echo ""
echo "🚀 Demo Instructions:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Click 'Start Global Load Test' button"
echo "3. Watch the metrics update in real-time"
echo "4. Try the failover controls to simulate regional failures"
echo ""
echo "📈 Expected Dashboard Metrics (non-zero values):"
echo "  - Average Latency: 20-80ms (varies by region)"
echo "  - P95 Latency: 50-150ms"
echo "  - Success Rate: ~98%"
echo "  - Throughput: Variable requests/min"
echo ""
echo "🔍 Verifying server is running..."

# Check if server is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Server is running on port 3000"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Open the dashboard in your browser"
    echo "2. Start a load test"
    echo "3. Observe real-time metrics updating"
    echo ""
    echo "Press Ctrl+C to exit this demo script"
    echo ""
    
    # Keep script running
    while true; do
        sleep 10
        # Check server health
        if ! curl -s http://localhost:3000 > /dev/null; then
            echo "❌ Server stopped running!"
            exit 1
        fi
    done
else
    echo "❌ Server is not running!"
    echo "Run './scripts/start.sh' first"
    exit 1
fi

