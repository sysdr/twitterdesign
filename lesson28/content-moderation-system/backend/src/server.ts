import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { setupRoutes } from './controllers';
import { setupDatabase } from './config/database';
import { setupRedis } from './config/redis';
import { setupQueues } from './queues/moderationQueue';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Setup database and Redis
setupDatabase();
setupRedis();
setupQueues();

// Routes
setupRoutes(app);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = createServer(app);

server.listen(PORT, () => {
  logger.info(`Content Moderation Server running on port ${PORT}`);
});

export default app;
