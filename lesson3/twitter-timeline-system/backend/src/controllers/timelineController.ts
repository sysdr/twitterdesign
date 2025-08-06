import { Request, Response } from 'express';
import { TimelineService } from '../services/timelineService.js';
import { db } from '../services/database.js';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

const timelineService = new TimelineService();

export const getTimeline = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'demo-user'; // In real app, get from auth
    const { cursor, limit = 20 } = req.query;
    
    const timeline = await timelineService.getTimeline(
      userId,
      cursor as string,
      parseInt(limit as string)
    );
    
    res.json(timeline);
  } catch (error) {
    console.error('Timeline generation error:', error);
    res.status(500).json({ error: 'Failed to generate timeline' });
  }
};

export const postTweet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const { content } = req.body;
    
    // Insert tweet
    const tweetQuery = `
      INSERT INTO tweets (id, user_id, content, created_at, updated_at, likes, retweets, replies)
      VALUES (gen_random_uuid(), $1, $2, NOW(), NOW(), 0, 0, 0)
      RETURNING id, user_id, content, created_at, likes, retweets, replies
    `;
    
    const result = await db.query(tweetQuery, [userId, content]);
    const tweet = result.rows[0];
    
    // Trigger fanout
    await timelineService.fanoutTweet(tweet.id, userId);
    
    res.status(201).json(tweet);
  } catch (error) {
    console.error('Tweet creation error:', error);
    res.status(500).json({ error: 'Failed to create tweet' });
  }
};
