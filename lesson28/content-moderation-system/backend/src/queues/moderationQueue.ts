import Queue from 'bull';
import { logger } from '../utils/logger';

let moderationQueue: Queue.Queue | null = null;

export const getModerationQueue = (): Queue.Queue => {
  if (!moderationQueue) {
    moderationQueue = new Queue('moderation', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      }
    });

    moderationQueue.on('error', (error) => {
      logger.error('Moderation queue error:', error);
    });

    moderationQueue.on('waiting', (jobId) => {
      logger.info(`Job ${jobId} is waiting`);
    });

    moderationQueue.on('active', (job) => {
      logger.info(`Job ${job.id} is now active`);
    });

    moderationQueue.on('completed', (job) => {
      logger.info(`Job ${job.id} completed`);
    });

    moderationQueue.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed:`, err);
    });
  }
  return moderationQueue;
};

export const setupQueues = (): void => {
  try {
    getModerationQueue();
    logger.info('Moderation queue setup complete');
  } catch (error) {
    logger.error('Queue setup failed:', error);
    throw error;
  }
};

export const closeQueues = async (): Promise<void> => {
  if (moderationQueue) {
    await moderationQueue.close();
    moderationQueue = null;
    logger.info('Moderation queue closed');
  }
};
