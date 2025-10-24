import { Router } from 'express';
import { ModerationService } from '../services/moderationService';
import { AppealsService } from '../services/appealsService';
import { AnalyticsService } from '../services/analyticsService';
import { logger } from '../utils/logger';

const router = Router();
const moderationService = new ModerationService();
const appealsService = new AppealsService();
const analyticsService = new AnalyticsService();

// Get moderation queue
router.get('/queue', async (req, res) => {
  try {
    const { status = 'pending', priority = 'all' } = req.query;
    
    const queue = await moderationService.getModerationQueue({
      status: status as string,
      priority: priority as string
    });
    
    res.json(queue);
  } catch (error) {
    logger.error('Error fetching moderation queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// Submit human review
router.post('/review/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { decision, reason, moderatorId } = req.body;
    
    const review = await moderationService.submitHumanReview({
      postId,
      moderatorId,
      decision,
      reason
    });
    
    res.json(review);
  } catch (error) {
    logger.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get moderation statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await moderationService.getModerationStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get appeals (proxy to appeals service)
router.get('/appeals', async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    
    const appeals = await appealsService.getAppeals({
      status: status as string,
      page: Number(page),
      limit: Number(limit)
    });
    
    res.json(appeals);
  } catch (error) {
    logger.error('Error fetching appeals:', error);
    res.status(500).json({ error: 'Failed to fetch appeals' });
  }
});

// Submit appeal (proxy to appeals service)
router.post('/appeals', async (req, res) => {
  try {
    const { postId, userId, reason } = req.body;
    
    const appeal = await appealsService.submitAppeal({
      postId,
      userId,
      reason
    });
    
    res.status(201).json(appeal);
  } catch (error) {
    logger.error('Error submitting appeal:', error);
    res.status(500).json({ error: 'Failed to submit appeal' });
  }
});

// Process appeal (proxy to appeals service)
router.post('/appeals/:id/process', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reason, moderatorId } = req.body;
    
    const result = await appealsService.resolveAppeal(id, decision, reason);
    
    res.json(result);
  } catch (error) {
    logger.error('Error processing appeal:', error);
    res.status(500).json({ error: 'Failed to process appeal' });
  }
});

// Get analytics (proxy to analytics service)
router.get('/analytics', async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    
    const analytics = await analyticsService.getModerationAnalytics(range as string);
    
    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export { router as moderationController };
