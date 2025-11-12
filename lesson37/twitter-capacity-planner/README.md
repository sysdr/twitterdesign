# Queuing Theory Capacity Planning System

Mathematical capacity planning using Little's Law and M/M/1 queue models.

## Quick Start

```bash
# Install dependencies and build
./build.sh

# Run tests
npm test

# Start demo
./demo.sh

# Or start development server
./start.sh
```

## Features

- Real-time queue metrics collection
- Little's Law calculations (L = λW)
- M/M/1 queue modeling for predictions
- Automatic scaling recommendations
- Live performance dashboards
- Multiple traffic pattern simulations

## Mathematical Models

### Little's Law
L = λW
- L: Average items in system
- λ: Arrival rate
- W: Average time in system

### M/M/1 Queue
- Wait time: W = 1/(μ - λ)
- Queue length: L = λ/(μ - λ)
- Utilization: ρ = λ/μ

## Usage

1. Start the simulation
2. Select traffic pattern
3. Watch real-time metrics
4. Observe auto-scaling decisions
5. Validate predictions against actual behavior

## Testing

The system includes:
- Unit tests for queuing theory models
- Integration tests for capacity planner
- Performance validation tests

Run with: `npm test`
