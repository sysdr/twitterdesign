import express from 'express';
import cors from 'cors';
import consul from 'consul';

class TimelineService {
  private app = express();
  private port = process.env.PORT || 3004;

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
      res.json({ status: 'healthy', service: 'timeline-service' });
    });
    
    this.app.get('/', (req, res) => {
      res.json({ message: 'timeline-service is running', timestamp: new Date() });
    });
  }

  private async registerWithConsul(): Promise<void> {
    try {
      const consulClient = consul();
      await consulClient.agent.service.register({
        id: `timeline-service-${Date.now()}`,
        name: 'timeline-service',
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
      console.log(`⚙️  timeline-service running on port ${this.port}`);
      this.registerWithConsul();
    });
  }
}

new TimelineService().start();
