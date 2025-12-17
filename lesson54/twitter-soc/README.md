# Security Operations Center - Twitter System Design

Production-ready Security Operations Center with real-time threat detection, automated incident response, and compliance monitoring.

## Features

- ✅ Real-time threat detection (99.9% accuracy)
- ✅ Automated incident response (sub-second)
- ✅ Brute force attack prevention
- ✅ SQL injection detection
- ✅ Anomaly detection with behavioral analysis
- ✅ Compliance monitoring and reporting
- ✅ Real-time dashboard with WebSocket updates

## Quick Start

### Without Docker

```bash
# Install dependencies
npm install

# Build project
npm run build

# Start PostgreSQL and Redis locally

# Run development server
npm run dev

# In another terminal, run demo
npm run demo

# View dashboard
open http://localhost:3004/dashboard
```

### With Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f soc

# Access dashboard
open http://localhost:3004/dashboard

# Stop services
docker-compose down
```

## Testing

```bash
# Run test suite
npm test

# Test threat detection
curl -X POST http://localhost:3004/api/security/event \
  -H "Content-Type: application/json" \
  -d '{"eventType":"AUTH","ipAddress":"10.0.0.1","action":"LOGIN_ATTEMPT","outcome":"FAILURE"}'
```

## API Endpoints

- `POST /api/security/event` - Submit security event
- `GET /api/security/stats` - Get real-time statistics
- `GET /api/security/threats` - List recent threats
- `GET /api/security/compliance/report` - Generate compliance report

## Dashboard Features

- Real-time threat monitoring
- Automated response tracking
- Compliance metrics
- Threat timeline
- Live WebSocket updates

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Events    │────▶│     SOC      │────▶│    Response     │
│ Collection  │     │   Service    │     │    Engine       │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Dashboard  │
                    │   (WebSocket)│
                    └──────────────┘
```

## Performance Targets

- Event processing: <10ms
- Threat detection: 99.9% accuracy
- Response time: <1s
- False positive rate: <1%

## License

MIT
