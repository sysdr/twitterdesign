# Distributed Caching System - Twitter Scale Architecture

A production-ready distributed caching system that can handle 1 million requests per second using Redis sharding, intelligent warming, and geographic coherence.

## 🚀 Features

- **Cache Sharding**: Distribute load across multiple Redis instances
- **Intelligent Warming**: Predictive content preloading
- **Geographic Coherence**: Multi-region cache consistency
- **Real-time Monitoring**: Live performance dashboards
- **High Availability**: Automatic failover and recovery

## 🏗️ Architecture

- **Backend**: Node.js + TypeScript + Express
- **Frontend**: React + TypeScript + Ant Design
- **Caching**: Redis cluster with consistent hashing
- **Monitoring**: Prometheus + real-time WebSocket metrics

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- 4GB+ RAM recommended

## ⚡ Quick Start

1. **Build the system:**
   ```bash
   ./build.sh
   ```

2. **Start all services:**
   ```bash
   ./start.sh
   ```

3. **Access the dashboard:**
   - Dashboard: http://localhost:3000
   - API: http://localhost:8000
   - Prometheus: http://localhost:9090

4. **Run demo:**
   ```bash
   ./demo.sh
   ```

5. **Stop services:**
   ```bash
   ./stop.sh
   ```

## 📊 Monitoring

The system provides comprehensive monitoring:
- Real-time cache hit/miss ratios
- Response time analytics
- Node health status
- Geographic performance metrics

## 🧪 Testing

Run the test suite:
```bash
./test.sh
```

## 📖 API Endpoints

- `GET /api/cache/:key` - Get cached value
- `POST /api/cache` - Set cache value
- `DELETE /api/cache/:key` - Delete cached value
- `POST /api/cache/mget` - Multi-get operation
- `GET /api/cache/stats/overview` - Cache statistics
- `DELETE /api/cache/flush/all` - Flush all caches

## 🏆 Performance Targets

- **Throughput**: 1M+ requests/second
- **Hit Rate**: >95%
- **Latency**: <20ms for cache hits
- **Availability**: 99.99% uptime

## 🔧 Configuration

Environment variables in `backend/.env`:
- `REDIS_CLUSTER_NODES`: Redis node endpoints
- `CACHE_TTL`: Default cache TTL in seconds
- `WARMING_INTERVAL`: Cache warming interval in milliseconds

Built for Twitter System Design Course - Lesson 18: Distributed Caching
