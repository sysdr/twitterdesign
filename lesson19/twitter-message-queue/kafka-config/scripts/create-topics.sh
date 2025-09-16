#!/bin/bash

echo "Creating Kafka topics..."

# Wait for Kafka to be ready
sleep 10

# Create topics using kafka-topics.sh from within kafka container
docker exec kafka-1 /usr/bin/kafka-topics --create \
    --bootstrap-server kafka-1:29092 \
    --topic tweets \
    --partitions 12 \
    --replication-factor 3 \
    --config retention.ms=86400000 \
    --config segment.ms=3600000

docker exec kafka-1 /usr/bin/kafka-topics --create \
    --bootstrap-server kafka-1:29092 \
    --topic timeline-updates \
    --partitions 12 \
    --replication-factor 3 \
    --config retention.ms=86400000

docker exec kafka-1 /usr/bin/kafka-topics --create \
    --bootstrap-server kafka-1:29092 \
    --topic notifications \
    --partitions 6 \
    --replication-factor 3 \
    --config retention.ms=172800000

# List created topics
docker exec kafka-1 /usr/bin/kafka-topics --list --bootstrap-server kafka-1:29092

echo "Topics created successfully!"
