import { Response } from 'express';
import { AuthenticatedRequest, Tweet, APIResponse } from '../../types';

// Enhanced tweet interface for v2
interface TweetV2 extends Tweet {
  reactions?: {
    like: number;
    dislike: number;
    laugh: number;
    angry: number;
  };
  thread?: string[];
  poll?: {
    question: string;
    options: Array<{ text: string; votes: number }>;
    expiresAt: Date;
  };
}

let tweetsV2: TweetV2[] = [
  {
    id: '1',
    content: 'Hello Twitter API v2! ✨ Now with reactions and polls!',
    authorId: '1',
    createdAt: new Date(),
    likes: 12,
    retweets: 5,
    replies: 3,
    reactions: {
      like: 12,
      dislike: 1,
      laugh: 8,
      angry: 0
    }
  }
];

export const getTweets = async (req: AuthenticatedRequest, res: Response<APIResponse<TweetV2[]>>) => {
  const page = parseInt((req.query?.page as string) || '1');
  const limit = parseInt((req.query?.limit as string) || '10');
  const offset = (page - 1) * limit;
  
  let paginatedTweets = tweetsV2.slice(offset, offset + limit);
  
  // Filter features based on API version support (simplified for now)
  const supportsReactions = true; // We'll implement proper version checking later
  
  if (!supportsReactions) {
    paginatedTweets = paginatedTweets.map(tweet => {
      const { reactions, ...basicTweet } = tweet;
      return basicTweet;
    });
  }
  
  res.json({
    data: paginatedTweets,
    meta: {
      page,
      limit,
      total: tweetsV2.length,
      rateLimitInfo: req.rateLimitInfo
    }
  });
};

export const createTweet = async (req: AuthenticatedRequest, res: Response<APIResponse<TweetV2>>) => {
  const { content, poll } = req.body || {};
  
  if (!content || content.length > 280) {
    return res.status(400).json({
      error: 'Invalid tweet content',
      message: 'Tweet content must be between 1 and 280 characters'
    });
  }
  
  const tweet: TweetV2 = {
    id: Date.now().toString(),
    content,
    authorId: req.user!.id,
    createdAt: new Date(),
    likes: 0,
    retweets: 0,
    replies: 0,
    reactions: {
      like: 0,
      dislike: 0,
      laugh: 0,
      angry: 0
    },
    poll: poll ? {
      question: poll.question,
      options: poll.options.map((opt: string) => ({ text: opt, votes: 0 })),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    } : undefined
  };
  
  tweetsV2.unshift(tweet);
  
  res.status(201).json({
    data: tweet,
    message: 'Tweet created successfully',
    meta: {
      rateLimitInfo: req.rateLimitInfo
    }
  });
};

export const reactToTweet = async (req: AuthenticatedRequest, res: Response<APIResponse<TweetV2>>) => {
  const { reaction } = req.body || {};
  const validReactions = ['like', 'dislike', 'laugh', 'angry'];
  
  if (!validReactions.includes(reaction)) {
    return res.status(400).json({
      error: 'Invalid reaction',
      message: `Reaction must be one of: ${validReactions.join(', ')}`
    });
  }
  
  const tweet = tweetsV2.find(t => t.id === req.params?.id);
  
  if (!tweet) {
    return res.status(404).json({
      error: 'Tweet not found'
    });
  }
  
  if (!tweet.reactions) {
    tweet.reactions = { like: 0, dislike: 0, laugh: 0, angry: 0 };
  }
  
  tweet.reactions[reaction as keyof typeof tweet.reactions]++;
  
  res.json({
    data: tweet,
    message: 'Reaction added successfully',
    meta: {
      rateLimitInfo: req.rateLimitInfo
    }
  });
};
