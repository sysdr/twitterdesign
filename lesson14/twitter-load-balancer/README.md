# Advanced Load Balancer - Twitter System Design

A production-ready load balancer implementation with consistent hashing, geographic routing, and health checking capabilities.

## Features

- **Consistent Hashing**: Distributes requests evenly across servers with minimal reshuffling
- **Bounded Loads**: Prevents server overload with intelligent load limiting
- **Geographic Routing**: Routes users to their nearest data center
- **Health Checking**: Monitors server health and automatically handles failovers
- **Real-time Metrics**: Live dashboard showing performance metrics
- **Fault Tolerance**: Handles server failures gracefully

## Quick Start

```bash
# Build and test
./build.sh

# Start the application
./start.sh

# Or with Docker
./start-docker.sh
```

## Architecture

The load balancer operates on three tiers:
1. **Edge Load Balancer**: Geographic routing and SSL termination
2. **Regional Load Balancer**: Consistent hashing and health checking
3. **Service Load Balancer**: Service-specific routing and metrics

## Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# Load testing
# Open dashboard and use the request simulator
```

## Configuration

Key configuration options in `src/services/LoadBalancerService.ts`:
- `maxLoad`: Maximum requests per server
- `healthCheckInterval`: Health check frequency
- `failureThreshold`: Failed requests before marking unhealthy

## Monitoring

The dashboard provides real-time metrics:
- Requests per second
- Average response time
- Error rates
- Server load distribution
- Geographic routing statistics
