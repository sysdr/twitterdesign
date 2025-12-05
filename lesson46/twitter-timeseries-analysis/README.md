# Lesson 46: Time Series Analysis System

Real-time anomaly detection and forecasting system for Twitter-scale distributed systems.

## Features

- **Real-time Anomaly Detection**: Z-score based analysis with 95%+ accuracy
- **Forecasting Engine**: 60-second ahead predictions using exponential smoothing
- **Trend Analysis**: Identifies increasing/decreasing/stable patterns
- **Interactive Dashboard**: Live visualization with anomaly markers

## Quick Start

### Without Docker
```bash
./build.sh    # Install dependencies and build
./start.sh    # Start development server
./demo.sh     # Run with demo script
```

### With Docker
```bash
docker-compose up --build
```

Visit http://localhost:3000

## Architecture

- **AnomalyDetector**: Statistical analysis using Z-scores
- **ForecastEngine**: ARIMA-inspired forecasting with confidence intervals
- **TrendAnalyzer**: Moving average comparison for trend detection
- **Real-time Dashboard**: React-based visualization

## Testing

```bash
npm test
```

## Performance Metrics

- Processing: 1,000 metrics/second
- Detection Latency: <50ms
- Forecast Accuracy: 90-95%
- Dashboard Update: Every second

## Assignment

Extend system with predictive auto-scaling based on forecasts.
See article for detailed requirements.
