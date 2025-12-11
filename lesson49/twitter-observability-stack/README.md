# Lesson 49: Advanced Monitoring and Observability

Complete observability stack with distributed tracing, SLI/SLO monitoring, and predictive alerting.

## Quick Start

### Without Docker
```bash
./build.sh
npm start              # Start main API server (port 3000)
./start-dashboard.sh  # Start dashboard server (port 8080)
npm run demo          # Run demo to generate metrics
```

### With Docker
```bash
docker-compose up -d
npm run demo
```

## Components

- **OpenTelemetry**: Distributed tracing and metrics collection
- **Jaeger**: Trace visualization
- **Prometheus**: Metrics storage and querying
- **Grafana**: Unified observability dashboard
- **ML Predictor**: LSTM-based predictive alerting

## Access Points

- **Dashboard**: http://localhost:8080 (Web-based observability dashboard)
- Application: http://localhost:3000
- Jaeger UI: http://localhost:16686
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)
- Metrics: http://localhost:3000/metrics

## Key Endpoints

- `GET /api/timeline/:userId` - Get user timeline (traced)
- `POST /api/tweet` - Post tweet (traced)
- `GET /api/slo-status` - SLO compliance status
- `GET /api/predictions` - ML predictions
- `GET /metrics` - Prometheus metrics

## Testing

```bash
npm test
```

## Dashboard

The observability dashboard provides a comprehensive web interface to monitor all aspects of the system:

- **Real-time SLO Status**: View Service Level Objective compliance with visual progress indicators
- **ML Predictions**: See predictive alerts from the LSTM-based anomaly detection system
- **Prometheus Query Examples**: Learn how to query metrics using PromQL
- **Grafana Visualization Demos**: See example visualizations you can create in Grafana
- **API Operations Overview**: View all available API endpoints and their capabilities

To start the dashboard:
```bash
./start-dashboard.sh
# Or
npm run start:dashboard
```

The dashboard will be available at http://localhost:8080

## Architecture

The system implements:
1. Distributed tracing across all services
2. SLI/SLO framework for business metrics
3. Predictive alerting using LSTM models
4. Real-time observability dashboards
5. Web-based dashboard for easy monitoring

