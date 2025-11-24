# Twitter Cache Optimization System
## Lesson 41: LRU-K, ARC, and Predictive Warming

Advanced cache optimization algorithms achieving 85%+ hit rates through mathematical modeling.

## Features

- **LRU-K Cache**: Eliminates one-hit wonder pollution
- **ARC Cache**: Self-tuning recency/frequency balance  
- **Working Set Analysis**: Mathematical cache sizing
- **Predictive Warming**: Pattern-based preloading
- **Real-time Dashboard**: Live performance monitoring

## Quick Start

### Without Docker

```bash
# Build
./build.sh

# Run tests
npm test

# Run interactive demo
npm run demo

# Start API server
npm run dev
```

Visit http://localhost:3000/index.html

### With Docker

```bash
docker-compose up --build
```

## Architecture

```
User Request
    ↓
L1 Cache (LRU-K)     ← 100 items, K=2
    ↓ (miss)
L2 Cache (ARC)       ← 500 items, adaptive
    ↓ (miss)
Database             ← 50ms latency
    ↑
Predictive Warmer    ← Pattern learning
```

## API Endpoints

- `GET /api/tweets/:id` - Get tweet (cached)
- `GET /api/cache/stats` - Cache statistics
- `GET /api/patterns` - Access patterns
- `POST /api/cache/reset` - Reset cache

## Performance Results

- Hit Rate: 85%+
- Average Latency: 2-5ms (vs 50ms database)
- Latency Reduction: 90%+
- Prediction Accuracy: 70%+

## Testing

```bash
# Unit tests
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## Key Concepts

### LRU-K Algorithm
Tracks K previous accesses to distinguish hot data from one-time accesses.

### ARC Algorithm  
Maintains recency (T1) and frequency (T2) lists, automatically adapting split based on workload.

### Working Set Theory
Measures unique items accessed in time window to determine optimal cache size.

### Predictive Warming
Learns sequential access patterns to preload data before requests arrive.

## Production Insights

This implementation mirrors caching strategies used by:
- Instagram: LRU-K for timeline caching
- Redis: ARC-inspired adaptive caching
- Netflix: Predictive warming for video content
- Facebook: Working set sizing for photo caches

## License

MIT License - Educational purposes

