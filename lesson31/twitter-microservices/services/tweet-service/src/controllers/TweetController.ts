import { Request, Response } from 'express';
import { Tweet } from '../models/Tweet';

export class TweetController {
  async createTweet(req: Request, res: Response): Promise<void> {
    try {
      const { userId, content, mediaUrls = [] } = req.body;
      
      // Extract hashtags and mentions
      const hashtags = content.match(/#\w+/g) || [];
      const mentions = content.match(/@\w+/g) || [];
      
      const tweet = new Tweet({
        userId,
        content,
        mediaUrls,
        hashtags,
        mentions
      });

      await tweet.save();
      res.status(201).json(tweet);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create tweet' });
    }
  }

  async getTweet(req: Request, res: Response): Promise<void> {
    try {
      const tweet = await Tweet.findById(req.params.id);
      if (!tweet) {
        res.status(404).json({ error: 'Tweet not found' });
        return;
      }
      res.json(tweet);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteTweet(req: Request, res: Response): Promise<void> {
    try {
      const tweet = await Tweet.findByIdAndDelete(req.params.id);
      if (!tweet) {
        res.status(404).json({ error: 'Tweet not found' });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async likeTweet(req: Request, res: Response): Promise<void> {
    try {
      const tweet = await Tweet.findByIdAndUpdate(
        req.params.id,
        { $inc: { likeCount: 1 } },
        { new: true }
      );
      res.json(tweet);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async retweetTweet(req: Request, res: Response): Promise<void> {
    try {
      const tweet = await Tweet.findByIdAndUpdate(
        req.params.id,
        { $inc: { retweetCount: 1 } },
        { new: true }
      );
      res.json(tweet);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUserTweets(req: Request, res: Response): Promise<void> {
    try {
      const tweets = await Tweet.find({ userId: req.params.userId })
        .sort({ createdAt: -1 })
        .limit(20);
      res.json(tweets);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
