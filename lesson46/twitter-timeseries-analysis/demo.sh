#!/bin/bash
echo "=================================="
echo "Time Series Analysis System Demo"
echo "=================================="

echo "Starting demonstration..."
echo "1. System generates metrics every second"
echo "2. Anomaly detector analyzes using Z-score (threshold: 3σ)"
echo "3. Forecast engine predicts next 60 seconds"
echo "4. Trend analyzer identifies patterns"
echo ""
echo "Opening dashboard at http://localhost:3000"
echo "Watch for:"
echo "  - Real-time metrics chart (blue line)"
echo "  - Forecasts with confidence intervals (green dashed line)"
echo "  - Anomaly markers (red/yellow/green dots)"
echo "  - Alert panel showing recent anomalies"
echo "  - Metrics panel showing current state"
echo ""
echo "Press Ctrl+C to stop the demo"

npm run dev
