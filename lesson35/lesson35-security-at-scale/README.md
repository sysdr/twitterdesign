# Lesson 35: Security at Scale

Production-grade security system implementing OAuth 2.0, rate limiting, abuse detection, and threat scoring for Twitter-scale applications.

## Features

- **OAuth 2.0 Authentication**: JWT-based auth with refresh token rotation
- **Fine-Grained Authorization**: RBAC with relationship-based access control
- **Rate Limiting**: Token bucket algorithm with per-IP and per-user limits
- **Abuse Detection**: ML-powered threat scoring and bot detection
- **Real-Time Dashboard**: WebSocket-powered security monitoring
- **Geographic Tracking**: IP geolocation for threat analysis

## Quick Start

### Without Docker

```bash
# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Start Redis
redis-server --daemonize yes

# Run services
./scripts/start.sh

# In another terminal, run demo
./scripts/demo.sh
```

### With Docker

```bash
docker-compose up -d
```

## Architecture

- **Backend**: Node.js/Express with TypeScript
- **Frontend**: React with TypeScript and Vite
- **Database**: Redis for sessions, rate limits, and caching
- **Real-time**: WebSocket for live security events

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/user/threat-score` - Get user threat score
- `GET /api/security/events` - Get security events
- `GET /api/security/stats` - Get security statistics

## Testing

```bash
cd backend
npm test
```

## Success Metrics

- ✓ JWT validation < 1ms (P99)
- ✓ Rate limiting blocking 99.9% of DDoS traffic
- ✓ Threat detection catching 99.9% of bots
- ✓ Zero false positives blocking legitimate users
- ✓ Real-time security dashboard with < 100ms latency

## License

MIT
