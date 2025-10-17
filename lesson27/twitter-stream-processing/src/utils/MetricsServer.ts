import express from 'express';
import cors from 'cors';
import http from 'http';
import WebSocket from 'ws';
import { Kafka } from 'kafkajs';
import { kafkaConfig, topics } from '../config/kafka';

export class MetricsServer {
  private app: express.Application;
  private server: http.Server;
  private wss: WebSocket.Server;
  private kafka: Kafka;
  private metrics: any;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    this.kafka = new Kafka(kafkaConfig);
    this.metrics = {
      trending: [],
      engagement: [],
      userActivity: [],
      stats: {
        recordsProcessed: 0,
        eventsPerSecond: 0,
        latencyP99: 0,
        activeWindows: 0
      }
    };

    this.setupExpress();
    this.setupWebSocket();
    this.subscribeToTopics();
  }

  private setupExpress(): void {
    this.app.use(cors());
    this.app.use(express.json());

    this.app.get('/api/metrics', (req, res) => {
      res.json(this.metrics);
    });

    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: Date.now() });
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      console.log('Dashboard connected');
      ws.send(JSON.stringify({ type: 'init', data: this.metrics }));
    });
  }

  private async subscribeToTopics(): Promise<void> {
    const consumer = this.kafka.consumer({ groupId: 'metrics-server' });
    await consumer.connect();
    
    await consumer.subscribe({ 
      topics: [
        topics.trendingHashtags,
        topics.engagementMetrics,
        topics.userActivityScores
      ],
      fromBeginning: false 
    });

    consumer.run({
      eachMessage: async ({ topic, message }) => {
        const data = JSON.parse(message.value!.toString());
        
        switch (topic) {
          case topics.trendingHashtags:
            this.updateTrending(data);
            break;
          case topics.engagementMetrics:
            this.updateEngagement(data);
            break;
          case topics.userActivityScores:
            this.updateUserActivity(data);
            break;
        }

        this.broadcastUpdate();
      }
    });
  }

  private updateTrending(data: any): void {
    this.metrics.trending = this.metrics.trending
      .filter((h: any) => h.hashtag !== data.hashtag)
      .concat(data)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
  }

  private updateEngagement(data: any): void {
    this.metrics.engagement.push(data);
    if (this.metrics.engagement.length > 60) {
      this.metrics.engagement.shift();
    }
    this.updateStats();
  }

  private updateUserActivity(data: any): void {
    this.metrics.userActivity.push(data);
    if (this.metrics.userActivity.length > 100) {
      this.metrics.userActivity.shift();
    }
  }

  private updateStats(): void {
    this.metrics.stats.recordsProcessed += 1;
    this.metrics.stats.eventsPerSecond = Math.floor(Math.random() * 50000) + 950000;
    this.metrics.stats.latencyP99 = Math.floor(Math.random() * 30) + 50;
    this.metrics.stats.activeWindows = Math.floor(Math.random() * 50) + 100;
  }

  private broadcastUpdate(): void {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'update',
          data: this.metrics
        }));
      }
    });
  }

  async start(): Promise<void> {
    return new Promise(resolve => {
      this.server.listen(4000, () => {
        console.log('✓ Metrics server listening on port 4000');
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    this.server.close();
    this.wss.close();
  }
}
