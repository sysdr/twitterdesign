import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import consul from 'consul';
import { UserRoutes } from './routes/UserRoutes';
import { AuthRoutes } from './routes/AuthRoutes';

class UserService {
  private app = express();
  private port = process.env.PORT || 3002;
  private consul = consul();

  constructor() {
    this.setupMiddleware();
    this.setupRoutes();
    this.connectDatabase();
    // registerWithConsul will be called after server starts
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'user-service' });
    });
    
    this.app.use('/auth', AuthRoutes);
    this.app.use('/users', UserRoutes);
  }

  private async connectDatabase(): Promise<void> {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/twitter_users');
      console.log('📦 Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
    }
  }

  private async registerWithConsul(): Promise<void> {
    try {
      await this.consul.agent.service.register({
        id: `user-service-${Date.now()}`,
        name: 'user-service',
        port: this.port as number,
        address: 'localhost',
        check: {
          http: `http://localhost:${this.port}/health`,
          interval: '10s'
        }
      });
      console.log('✅ Registered with Consul');
    } catch (error: any) {
      console.error('❌ Consul registration failed:', error?.message || error);
      // Continue without Consul registration
    }
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`👤 User Service running on port ${this.port}`);
      // Register with Consul after server starts
      this.registerWithConsul();
    });
  }
}

const userService = new UserService();
userService.start();
