import { Router } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { logger } from '../utils/logger';

const router = Router();
const analyticsService = new AnalyticsService();

// Get moderation analytics
router.get('/moderation', async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    const analytics = await analyticsService.getModerationAnalytics(timeframe as string);
    
    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const metrics = await analyticsService.getPerformanceMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export { router as analyticsController };
