import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import consul from 'consul';
import { TweetRoutes } from './routes/TweetRoutes';

class TweetService {
  private app = express();
  private port = process.env.PORT || 3003;

  constructor() {
    this.setupMiddleware();
    this.setupRoutes();
    this.connectDatabase();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'tweet-service' });
    });
    this.app.use('/tweets', TweetRoutes);
  }

  private async connectDatabase(): Promise<void> {
    await mongoose.connect('mongodb://localhost:27017/twitter_tweets');
    console.log('📦 Tweet Service connected to MongoDB');
  }

  private async registerWithConsul(): Promise<void> {
    try {
      const consulClient = consul();
      await consulClient.agent.service.register({
        id: `tweet-service-${Date.now()}`,
        name: 'tweet-service',
        port: this.port as number,
        address: 'localhost',
        check: { http: `http://localhost:${this.port}/health`, interval: '10s' }
      });
      console.log('✅ Registered with Consul');
    } catch (error: any) {
      console.error('❌ Consul registration failed:', error?.message || error);
    }
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`🐦 Tweet Service running on port ${this.port}`);
      this.registerWithConsul();
    });
  }
}

new TweetService().start();
