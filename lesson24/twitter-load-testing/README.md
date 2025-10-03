# Multi-Region Load Testing Dashboard

A comprehensive load testing framework that simulates real-world traffic patterns across multiple geographic regions for Twitter-scale systems.

## Features

- **Geographic Load Generation**: Simulate users from different continents with varying network conditions
- **Automated Failover Testing**: Test system behavior during regional outages
- **Real-time Metrics**: Monitor performance across all regions simultaneously
- **Visual Dashboard**: Interactive map and metrics showing global system health

## Quick Start

```bash
# Install dependencies and build
./scripts/build.sh

# Start the dashboard
./scripts/start.sh

# Open http://localhost:3000 in your browser

# Stop services
./scripts/stop.sh
```

## Testing Scenarios

1. **Global Load Test**: Simulate traffic from all regions simultaneously
2. **Regional Failure**: Test system resilience when regions go offline
3. **Performance Validation**: Measure cross-region latency and throughput

## Architecture

- **Load Generators**: Distributed across multiple simulated regions
- **Failover Service**: Simulates regional failures and recovery
- **Metrics Service**: Aggregates performance data from all regions
- **Dashboard**: Real-time visualization of global system health
