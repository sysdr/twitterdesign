# Twitter Tweet Storage and Retrieval System
## Lesson 2: System Design Course

A production-ready tweet storage and retrieval system demonstrating real-time social media architecture patterns.

### 🎯 Learning Objectives
- Build scalable tweet storage with versioning
- Implement real-time engagement tracking
- Design performance-optimized REST APIs
- Handle 100+ tweets/second with sub-100ms response times

### 🚀 Quick Start

```bash
# Start the system
./scripts/start.sh

# Run tests
./scripts/test.sh

# Run demo
./scripts/demo.sh

# Stop the system
./scripts/stop.sh
```

### 🏗️ Architecture

**Frontend (React/TypeScript)**
- Tweet creation and display components
- Real-time performance monitoring
- Engagement interaction system

**Backend (Express/Node.js)**
- RESTful API with multimedia support
- Tweet versioning and history tracking
- Real-time engagement counters

**Storage (In-Memory)**
- Tweet content and metadata
- Version history with delta tracking
- Engagement metrics with atomic updates

### 📊 Performance Targets
- Response Time: < 100ms (P95)
- Throughput: 100+ tweets/second
- Availability: 99.9%
- Engagement Updates: Real-time

### 🧪 Testing
- Unit tests for components and models
- Integration tests for API endpoints
- Performance tests for throughput validation
- End-to-end tests for user workflows

### 📈 Monitoring
- Real-time response time tracking
- Request per second metrics
- System resource utilization
- Error rate monitoring

### 🔧 API Endpoints
- `POST /api/tweets` - Create tweet
- `GET /api/tweets` - List tweets
- `GET /api/tweets/:id` - Get specific tweet
- `PUT /api/tweets/:id` - Update tweet
- `POST /api/tweets/:id/engagement` - Update engagement
- `GET /api/tweets/:id/versions` - Get version history

### 🐳 Docker Support
```bash
docker-compose up -d
```

### 📚 Learning Points
1. **Event Sourcing**: Tweet versioning through immutable events
2. **Performance Optimization**: Multi-tier caching and query optimization
3. **Real-time Systems**: WebSocket-ready engagement tracking
4. **API Design**: RESTful patterns with file upload support
5. **Monitoring**: Production-ready metrics and alerting
