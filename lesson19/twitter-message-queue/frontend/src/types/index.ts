export interface Tweet {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
  partition?: number;
  offset?: number;
}

export interface MessageMetrics {
  messagesPerSecond: number;
  totalMessages: number;
  activePartitions: number;
  consumerLag: number;
  averageLatency: number;
}

export interface KafkaPartition {
  id: number;
  messageCount: number;
  offset: number;
  lag: number;
}

export interface ConsumerGroup {
  groupId: string;
  members: number;
  state: string;
  totalLag: number;
}
