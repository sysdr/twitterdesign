# Twitter MLOps System - Lesson 45

Production-ready MLOps system serving 1M predictions/second with automated model deployment, feature store, drift detection, and retraining pipelines.

## Features

- **Model Registry**: Version control and deployment management for ML models
- **Feature Store**: Real-time feature serving with Redis and PostgreSQL
- **Model Serving**: High-throughput prediction engine with batching and caching
- **Performance Monitoring**: Automated drift detection and model health tracking
- **Retraining Pipeline**: Automated model retraining triggered by performance degradation
- **Production Dashboard**: Real-time monitoring and operations UI

## Quick Start

### With Docker
```bash
# Build and start
./build.sh
./start.sh

# Run demo
./demo.sh

# View dashboard
open http://localhost:3000
```

### Without Docker
```bash
# Install dependencies
npm install

# Start Redis and PostgreSQL manually
# Update .env with connection details

# Build
npm run build

# Start
npm start
```

## API Endpoints

- `GET /health` - System health check
- `GET /metrics` - Prometheus metrics
- `POST /predict` - Generate predictions
- `POST /features/user/:userId/compute` - Compute user features
- `POST /features/tweet/:tweetId/compute` - Compute tweet features
- `GET /models` - List all models
- `GET /models/production` - Get production model
- `POST /models/:id/:version/promote` - Promote model to production
- `POST /retrain` - Trigger model retraining
- `GET /metrics/performance/:modelId` - Get model metrics

## Performance Targets

- Prediction throughput: 1M predictions/second
- Prediction latency: P95 < 50ms
- Feature serving: 100K features/second
- Model deployment: < 60 seconds
- Drift detection: Within 5 minutes

## Testing

```bash
npm test
```

## Architecture

The system consists of:
- Model Registry: Tracks all model versions and deployment status
- Feature Store: Dual-layer (Redis + PostgreSQL) feature management
- Serving Engine: Batched inference with prediction caching
- Performance Monitor: Real-time metrics and drift detection
- Retraining Pipeline: Automated model improvement workflow

## License

MIT
