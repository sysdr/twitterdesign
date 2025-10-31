import express from 'express';
import cors from 'cors';
import consul from 'consul';

class NotificationService {
  private app = express();
  private port = process.env.PORT || 3006;

  constructor() {
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'notification-service' });
    });
    
    this.app.get('/', (req, res) => {
      res.json({ message: 'notification-service is running', timestamp: new Date() });
    });
  }

  private async registerWithConsul(): Promise<void> {
    try {
      const consulClient = consul();
      await consulClient.agent.service.register({
        id: `notification-service-${Date.now()}`,
        name: 'notification-service',
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
      console.log(`⚙️  notification-service running on port ${this.port}`);
      this.registerWithConsul();
    });
  }
}

new NotificationService().start();
