import { Express } from 'express';
import { postsController } from './postsController';
import { moderationController } from './moderationController';
import { appealsController } from './appealsController';
import { analyticsController } from './analyticsController';

export function setupRoutes(app: Express) {
  app.use('/api/posts', postsController);
  app.use('/api/moderation', moderationController);
  app.use('/api/appeals', appealsController);
  app.use('/api/analytics', analyticsController);
  
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
}
