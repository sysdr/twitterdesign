import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ServiceDiscovery } from './services/ServiceDiscovery';
import { AuthMiddleware } from './middleware/AuthMiddleware';
import { RateLimitMiddleware } from './middleware/RateLimitMiddleware';
import { LoggingMiddleware } from './middleware/LoggingMiddleware';
import { HealthController } from './routes/HealthController';

class APIGateway {
  private app = express();
  private serviceDiscovery = new ServiceDiscovery();
  private port = process.env.PORT || 3000;

  constructor() {
    this.setupMiddleware();
    this.setupRoutes();
    this.setupServiceProxy();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(LoggingMiddleware);
    this.app.use(RateLimitMiddleware);
  }

  private setupRoutes(): void {
    this.app.use('/health', HealthController);
    
    // Protected routes require authentication
    this.app.use('/api/tweets', AuthMiddleware, this.createServiceProxy('tweet-service'));
    this.app.use('/api/timeline', AuthMiddleware, this.createServiceProxy('timeline-service'));
    this.app.use('/api/media', AuthMiddleware, this.createServiceProxy('media-service'));
    this.app.use('/api/notifications', AuthMiddleware, this.createServiceProxy('notification-service'));
    this.app.use('/api/analytics', AuthMiddleware, this.createServiceProxy('analytics-service'));
    
    // Public routes
    this.app.use('/api/auth', this.createServiceProxy('user-service'));
    this.app.use('/api/users', this.createServiceProxy('user-service'));
  }

  private setupServiceProxy(): void {
    // Dynamic service discovery and load balancing
    this.serviceDiscovery.startHealthChecking();
  }

  private createServiceProxy(serviceName: string) {
    return createProxyMiddleware({
      target: `http://localhost:${this.getServicePort(serviceName)}`,
      changeOrigin: true,
      pathRewrite: {
        [`^/api`]: '',
      },
      onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('X-Gateway-Request-ID', this.generateRequestId());
      },
      onError: (err, req, res) => {
        console.error(`Proxy error for ${serviceName}:`, err);
        res.status(503).json({ error: 'Service temporarily unavailable' });
      }
    });
  }

  private getServicePort(serviceName: string): number {
    const servicePorts: Record<string, number> = {
      'user-service': 3002,
      'tweet-service': 3003,
      'timeline-service': 3004,
      'media-service': 3005,
      'notification-service': 3006,
      'analytics-service': 3007
    };
    return servicePorts[serviceName] || 3000;
  }

  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 API Gateway running on port ${this.port}`);
      this.serviceDiscovery.registerService('api-gateway', this.port as number);
    });
  }
}

const gateway = new APIGateway();
gateway.start();
