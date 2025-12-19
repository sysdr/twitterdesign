# Performance Engineering System

Continuous performance testing and optimization system for Twitter-scale applications.

## Features

- **Real-time Metrics Collection**: Sub-1ms overhead metrics aggregation
- **Performance Budgets**: Automated enforcement with CI/CD integration
- **Regression Detection**: Statistical analysis catching 1% slowdowns
- **Automated Optimization**: ML-powered recommendations with confidence scores
- **Real-time Dashboard**: Live performance monitoring with WebSocket updates

## Quick Start

### Install and Run

```bash
# Install dependencies
npm install

# Start the system (development mode)
npm run dev
```

Visit:
- Dashboard: http://localhost:3000
- API: http://localhost:4000
- WebSocket: ws://localhost:4001

### Run Performance Tests

```bash
# Run test suite
npm run test:performance
```

### Using Docker

```bash
# Build and start with Docker Compose
docker-compose up --build
```

## Architecture

- **Metrics Collector**: StatsD-based collection with percentile aggregation
- **Performance Analyzer**: Statistical regression detection and budget enforcement
- **Test Orchestrator**: Automated test execution with realistic load patterns
- **Optimization Engine**: Rule-based and ML-powered optimization suggestions
- **Real-time Dashboard**: React-based UI with live metrics updates

## API Endpoints

- `GET /api/metrics` - Recent metrics
- `POST /api/test/run` - Run single test
- `POST /api/test/suite` - Run full test suite
- `GET /api/optimizations` - Get recommendations
- `POST /api/optimizations/:id/apply` - Apply optimization

## Performance Budgets

Default budgets (P95):
- Tweet creation: 50ms
- Timeline fetch: 30ms
- Database queries: 10ms
- Cache operations: 5ms

## Testing

The system runs three test tiers:

1. **Smoke Tests** (1min): 100 users, happy path
2. **Regression Tests** (5min): 500 users, baseline comparison
3. **Stress Tests** (15min): 1000+ users, breaking point identification

## Optimization Engine

Generates recommendations based on:
- Query performance analysis
- Cache hit rate optimization
- Connection pool tuning
- Algorithm efficiency improvements

Confidence scoring determines automatic vs. manual application.
