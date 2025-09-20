# Global User Session Management System

## Twitter System Design Course - Lesson 21

A production-ready distributed session management system with Redis clustering, JWT authentication, and global user session handling.

## Features

- ✅ Distributed Redis session storage with clustering
- ✅ JWT-based authentication with refresh tokens
- ✅ Cross-region session replication
- ✅ Session affinity and automatic failover
- ✅ Real-time session monitoring dashboard
- ✅ Rate limiting and security middleware

## Quick Start

### Local Development
```bash
# Build the system
./build.sh

# Start all services
./start.sh

# Run tests
./test.sh

# Run demo
./demo.sh

# Stop all services
./stop.sh
```

### Docker Deployment
```bash
# Start with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

## Architecture

The system consists of:
- **Frontend**: React/TypeScript SPA with Material-UI
- **Backend**: Node.js/Express API with TypeScript
- **Redis Cluster**: 3-node cluster for session storage
- **Session Manager**: Distributed session handling
- **Auth System**: JWT-based authentication

## Testing

Login with demo credentials:
- Email: demo@twitter.com
- Password: password123
- Region: us-east, eu-west, or asia-pacific

## API Endpoints

- POST /api/auth/login - User login
- POST /api/auth/logout - User logout  
- POST /api/auth/refresh - Refresh tokens
- GET /api/session/info - Session information
- GET /api/session/stats - Session statistics
- DELETE /api/session/revoke - Revoke session

## Monitoring

Access the session dashboard at /sessions to view:
- Current session information
- Global session statistics
- Regional distribution
- Activity metrics
