# Twitter Message Queue System with Apache Kafka

A hands-on implementation of a scalable message queue system using Apache Kafka, built as part of the Twitter System Design course.

## Features

- **Apache Kafka Cluster**: 3-broker cluster with topic partitioning
- **Exactly-Once Delivery**: Idempotent producers and transactional consumers
- **Real-time Processing**: WebSocket-based live updates
- **Load Balancing**: Intelligent partition assignment and consumer groups
- **Monitoring Dashboard**: Real-time metrics and system health
- **Horizontal Scaling**: Support for 100K+ messages per second

## Quick Start

1. **Build the system:**
   ```bash
   ./build.sh
   ```

2. **Start all services:**
   ```bash
   ./start.sh
   ```

3. **Access the applications:**
   - Frontend: http://localhost:3000
   - Kafka UI: http://localhost:8080
   - Health Check: http://localhost:3001/health

4. **Run load test:**
   ```bash
   node tests/load/load-test.js
   ```

5. **Stop all services:**
   ```bash
   ./stop.sh
   ```

## Architecture

- **Frontend**: React/TypeScript with real-time WebSocket updates
- **Backend**: Node.js with KafkaJS and Socket.IO
- **Message Queue**: Apache Kafka cluster (3 brokers)
- **Cache**: Redis for timeline caching
- **Monitoring**: Kafka UI for cluster management

## Key Components

- **Tweet Producer**: Publishes tweets with partition-key routing
- **Tweet Consumer**: Processes tweets with exactly-once semantics
- **Metrics Service**: Real-time performance monitoring
- **Timeline Processor**: Updates cached user timelines

## Testing

- Integration tests verify message flow
- Load tests demonstrate 10K+ messages/second throughput
- Health checks ensure system reliability

Perfect for learning distributed systems and Kafka at scale!
