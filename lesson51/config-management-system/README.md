# Configuration Management System at Scale

A production-ready configuration management system demonstrating GitOps workflows, canary deployments, configuration validation, and drift detection for managing 10,000+ servers.

## Features

- **GitOps Workflow**: Git as single source of truth for all configuration
- **Canary Deployments**: Progressive rollout with automatic rollback (1% → 10% → 50% → 100%)
- **Configuration Validation**: Multi-layer validation catching errors before deployment
- **Drift Detection**: Continuous monitoring with auto-remediation
- **Real-time Dashboard**: Live visualization of configuration health across server fleet

## Quick Start

### Without Docker

```bash
# Install dependencies and build
./build.sh

# Start the application
./start.sh

# Open browser to http://localhost:3000
```

### With Docker

```bash
# Build and run with Docker Compose
docker-compose up --build

# Open browser to http://localhost:3000
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Usage

1. **Trigger Deployment**: Click "Trigger Deployment" to start a canary deployment
2. **Simulate Drift**: Click "Simulate Drift" to see drift detection in action
3. **Monitor Progress**: Watch real-time updates as deployments progress through stages
4. **View Server Status**: See health status of all 100 servers in the fleet

## Architecture

- **Frontend**: React + TypeScript with real-time updates
- **Validation**: Multi-layer validation pipeline
- **Deployment**: Canary controller with health checking
- **Drift Detection**: Continuous 5-minute scan cycle
- **GitOps**: Reconciliation loop syncing Git to actual state

## Performance

- Validation: <5 seconds
- Full Canary Rollout: ~3 minutes (100 servers)
- Drift Detection: 5-minute intervals
- Rollback: <30 seconds
- Dashboard Updates: <100ms latency

## Stopping

```bash
# Stop all processes
./stop.sh
```
