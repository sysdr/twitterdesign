import { Router } from 'express';
import { AppealsService } from '../services/appealsService';
import { logger } from '../utils/logger';

const router = Router();
const appealsService = new AppealsService();

// Submit appeal
router.post('/', async (req, res) => {
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

// Get appeals
router.get('/', async (req, res) => {
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

// Process appeal
router.post('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, resolution } = req.body;
    
    const result = await appealsService.resolveAppeal(id, decision, resolution);
    
    res.json(result);
  } catch (error) {
    logger.error('Error resolving appeal:', error);
    res.status(500).json({ error: 'Failed to resolve appeal' });
  }
});

export { router as appealsController };
