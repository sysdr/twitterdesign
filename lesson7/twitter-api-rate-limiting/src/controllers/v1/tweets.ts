import { Response } from 'express';
import { AuthenticatedRequest, Tweet, APIResponse } from '../../types';

// Mock tweet database
let tweets: Tweet[] = [
  {
    id: '1',
    content: 'Hello Twitter API v1! 🚀',
    authorId: '1',
    createdAt: new Date(),
    likes: 5,
    retweets: 2,
    replies: 1
  }
];

export const getTweets = async (req: AuthenticatedRequest, res: Response<APIResponse<Tweet[]>>) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  
  const paginatedTweets = tweets.slice(offset, offset + limit);
  
  res.json({
    data: paginatedTweets,
    meta: {
      page,
      limit,
      total: tweets.length,
      rateLimitInfo: req.rateLimitInfo
    }
  });
};

export const createTweet = async (req: AuthenticatedRequest, res: Response<APIResponse<Tweet>>) => {
  const { content } = req.body;
  
  if (!content || content.length > 280) {
    return res.status(400).json({
      error: 'Invalid tweet content',
      message: 'Tweet content must be between 1 and 280 characters'
    });
  }
  
  const tweet: Tweet = {
    id: Date.now().toString(),
    content,
    authorId: req.user!.id,
    createdAt: new Date(),
    likes: 0,
    retweets: 0,
    replies: 0
  };
  
  tweets.unshift(tweet);
  
  res.status(201).json({
    data: tweet,
    message: 'Tweet created successfully',
    meta: {
      rateLimitInfo: req.rateLimitInfo
    }
  });
};

export const getTweet = async (req: AuthenticatedRequest, res: Response<APIResponse<Tweet>>) => {
  const tweet = tweets.find(t => t.id === req.params.id);
  
  if (!tweet) {
    return res.status(404).json({
      error: 'Tweet not found'
    });
  }
  
  res.json({
    data: tweet,
    meta: {
      rateLimitInfo: req.rateLimitInfo
    }
  });
};
