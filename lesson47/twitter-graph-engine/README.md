# Graph Algorithm Optimization - Twitter System Design

## Overview
Production-ready graph processing system for billion-edge social networks, implementing optimized community detection, influence analysis, and distributed partitioning.

## Features
- **Graph Algorithms**: Label Propagation, PageRank, METIS partitioning
- **Billion-Edge Scale**: Compressed Sparse Row format for memory efficiency
- **Real-Time Analysis**: Sub-second community detection and influence scoring
- **Interactive Dashboard**: D3.js visualization with force-directed layout
- **Production Ready**: Complete testing, monitoring, and optimization

## Quick Start

### Build and Run
```bash
./scripts/build.sh
./scripts/start.sh
```

### Run Tests
```bash
./scripts/test.sh
```

### Run Demo
```bash
# In separate terminal after starting services
./scripts/demo.sh
```

## Access Points
- **Dashboard**: http://localhost:5173
- **API**: http://localhost:3047
- **Health**: http://localhost:3047/health

## Architecture
- **Backend**: Node.js/TypeScript with Express
- **Frontend**: React/TypeScript with D3.js
- **Algorithms**: CSR graph storage, LPA, PageRank, METIS
- **Real-Time**: WebSocket updates for live analytics

## Performance Targets
- ✅ 1000-node graph processing in <100ms
- ✅ Community detection convergence in 5-10 iterations
- ✅ PageRank convergence with 0.0001 tolerance in <20 iterations
- ✅ Balanced partitioning with <5% edge cut
