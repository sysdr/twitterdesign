# Lesson 53: Capacity Planning and Auto-Scaling

## Overview
Intelligent auto-scaling system that predicts traffic patterns and automatically adjusts server capacity while optimizing costs.

## Features
- Real-time metrics collection
- Predictive traffic forecasting using exponential smoothing
- Cost-aware scaling decisions
- Auto-scaling with configurable thresholds
- Real-time dashboard with visualizations

## Quick Start

### Without Docker
```bash
# Install dependencies and build
./build.sh

# Start all services
./start.sh

# Access dashboard
open http://localhost:3000

# Stop all services
./stop.sh
```

### With Docker
```bash
docker-compose up --build
```

## Testing

### Unit Tests
```bash
npm test
```

### Manual Testing
```bash
# Test metrics collection
curl http://localhost:4000/api/metrics/current

# Test traffic prediction
curl http://localhost:4000/api/prediction

# Test scaling decision
curl -X POST http://localhost:4000/api/scaling/manual
```

## Architecture
- **Metrics Collector**: Collects system metrics every 5 seconds
- **Traffic Predictor**: Predicts next-hour traffic using historical data
- **Auto Scaler**: Makes scaling decisions every minute
- **Cost Calculator**: Validates cost-effectiveness of scaling
- **Dashboard**: Real-time visualization of all metrics

## Configuration
Edit `src/server.ts` to modify:
- `minServers`: Minimum number of servers (default: 2)
- `maxServers`: Maximum number of servers (default: 20)
- `targetUtilization`: Target CPU utilization (default: 70%)
- `cooldownPeriod`: Time between scaling actions (default: 180s)
- `maxDailyBudget`: Maximum daily spend (default: $50)

## Success Criteria
✓ System handles 10x traffic spikes automatically
✓ Predictions accurate within 20%
✓ Scaling decisions complete in <3 minutes
✓ Cost optimization reduces idle capacity by 40%
✓ Response time stays under 200ms during scaling

## Lessons Learned
1. Predictive scaling is more effective than reactive
2. Cost awareness prevents runaway infrastructure bills
3. Cooldown periods prevent scaling oscillation
4. Historical data patterns are surprisingly predictable
