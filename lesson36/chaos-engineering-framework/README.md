# Chaos Engineering Framework - Lesson 36

A production-ready chaos engineering system for systematic failure injection and resilience testing.

## Features

- 🔥 Multiple failure injection types (service, database, network, cache, CPU, memory)
- 📊 Real-time metrics monitoring and visualization
- 🛡️ Safety guardrails with automatic experiment abortion
- 🔄 Automated recovery mechanisms
- 🎯 Blast radius control to limit impact
- 🚨 Emergency stop button
- 📈 Live dashboard with system health visualization

## Quick Start

### Without Docker:
```bash
./build.sh    # Install dependencies and build
./start.sh    # Start all services
./demo.sh     # Run demonstration
```

### With Docker:
```bash
./docker-start.sh   # Start with Docker Compose
```

### Run Tests:
```bash
./test.sh
```

## Access Points

- **Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Chaos Experiments

1. **Service Unavailability** - Simulates API failures
2. **Database Latency** - Injects database query delays
3. **Database Failure** - Tests failover mechanisms
4. **Network Latency** - Adds network delays
5. **Cache Failure** - Simulates cache unavailability
6. **CPU Throttling** - Limits CPU resources
7. **Memory Pressure** - Consumes memory

## Safety Features

- Automatic abort when error rate > 0.1%
- Automatic abort when P99 latency > 500ms
- Blast radius control (affects only X% of traffic)
- Manual emergency stop button
- Automated rollback procedures

## Architecture

- **Backend**: Node.js/Express with TypeScript
- **Frontend**: React with TypeScript and Recharts
- **Real-time**: WebSocket for live updates
- **Monitoring**: Custom metrics collection
- **Safety**: Automated guardian system

## Next Steps

After mastering this lesson:
1. Experiment with different failure intensities
2. Observe how system recovers from failures
3. Try combining multiple failure types
4. Test during different load patterns
5. Move to Lesson 37 - Queuing Theory Applications
