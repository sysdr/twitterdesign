import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import analyticsService from '../services/analyticsService.js';

const router = Router();

// Get system-wide metrics
router.get('/system', authenticateToken, async (req, res) => {
  try {
    const metrics = await analyticsService.getSystemMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get system metrics'
    });
  }
});

// Get user-specific metrics
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const metrics = await analyticsService.getUserMetrics(userId);
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting user metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user metrics'
    });
  }
});

// Get top users by activity
router.get('/top-users', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const topUsers = await analyticsService.getTopUsers(limit);
    
    res.json({
      success: true,
      data: topUsers
    });
  } catch (error) {
    console.error('Error getting top users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top users'
    });
  }
});

// Get current user metrics
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const metrics = await analyticsService.getUserMetrics(userId);
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting current user metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user metrics'
    });
  }
});

export default router;
