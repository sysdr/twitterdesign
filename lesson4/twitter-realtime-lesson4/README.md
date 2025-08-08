# Twitter Real-Time Event Processing - Lesson 4

This lesson implements real-time event processing for a Twitter-like social media platform, featuring WebSocket connections, Redis pub/sub messaging, and event sourcing patterns.

## Features Implemented

- ✅ Real-time tweet delivery via WebSocket connections
- ✅ Redis pub/sub for scalable message distribution
- ✅ Event sourcing with complete audit trails
- ✅ Live notifications for likes and follows
- ✅ Connection management with heartbeat/ping-pong
- ✅ Real-time system statistics dashboard
- ✅ Multi-user switching for testing
- ✅ Graceful connection recovery

## Architecture

### Backend Components
- **WebSocket Service**: Manages persistent connections to 1,000+ concurrent users
- **Redis Service**: Handles pub/sub messaging and caching
- **Event Store**: Maintains complete audit log of all user actions
- **API Routes**: RESTful endpoints for tweets, likes, follows

### Frontend Components
- **WebSocket Hook**: Manages connection state and message handling
- **Timeline Component**: Real-time tweet display and composition
- **Notification Panel**: Live notifications for user interactions
- **Stats Dashboard**: Real-time system metrics

## Quick Start

1. **Start all services**:
   ```bash
   ./start.sh
   ```

2. **Run demo**:
   ```bash
   ./demo.sh
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000/api/stats
   - WebSocket: ws://localhost:8001

4. **Stop all services**:
   ```bash
   ./stop.sh
   ```

## Testing

```bash
# Run all tests
./test.sh

# Individual test commands
cd backend && npm test
cd frontend && npm test
```

## Docker Support

```bash
# Start with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## Usage Instructions

1. **Switch Users**: Use the dropdown to switch between alice_dev, bob_codes, and charlie_tech
2. **Create Tweets**: Type in the composer and click "Tweet"
3. **Like Tweets**: Click the heart icon to trigger notifications
4. **Monitor Stats**: Watch real-time system statistics
5. **Test Concurrency**: Open multiple browser tabs to simulate concurrent users

## Key Learning Points

- **WebSocket Management**: Handling connections, heartbeats, and graceful disconnections
- **Event-Driven Architecture**: Using events to decouple system components
- **Pub/Sub Patterns**: Scalable message distribution with Redis
- **Event Sourcing**: Building audit trails and enabling event replay
- **Real-Time UI Updates**: Updating interfaces without page refreshes

## Performance Targets

- ✅ Handle 1,000 concurrent WebSocket connections
- ✅ Deliver tweets to followers within 100ms
- ✅ Process and store events with complete audit trails
- ✅ Maintain connection stability with automatic recovery

## Next Steps

This real-time foundation enables:
- Trending topic calculations
- Real-time collaboration features
- Advanced notification systems
- Live analytics and monitoring
- Scalable event-driven microservices

Ready for Lesson 5: Caching Strategies! 🚀
