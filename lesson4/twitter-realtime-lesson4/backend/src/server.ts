import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { RedisService } from './services/redis/RedisService.js';
import { WebSocketService } from './services/websocket/WebSocketService.js';
import { EventStore } from './services/events/EventStore.js';
import { Tweet, Event, EventType, User } from './types/index.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8000', 10);
const WS_PORT = parseInt(process.env.WS_PORT || '8001', 10);

app.use(cors());
app.use(express.json());

// Services
const redisService = new RedisService();
const eventStore = new EventStore();
let wsService: WebSocketService;

// Mock data stores (in production, use proper database)
const users: Map<string, User> = new Map();
const tweets: Map<string, Tweet> = new Map();
const followers: Map<string, Set<string>> = new Map();

// Initialize services
async function initializeServices() {
  await redisService.connect();
  wsService = new WebSocketService(WS_PORT, redisService);
  
  // Subscribe to events for real-time processing
  await redisService.subscribe('tweet_events', async (event: Event) => {
    await eventStore.store(event);
    await processEvent(event);
  });

  console.log('🚀 All services initialized');
}

// Process events for real-time updates
async function processEvent(event: Event) {
  switch (event.type) {
    case EventType.TWEET_CREATED:
      await handleTweetCreated(event);
      break;
    case EventType.TWEET_LIKED:
      await handleTweetLiked(event);
      break;
    case EventType.USER_FOLLOWED:
      await handleUserFollowed(event);
      break;
  }
}

async function handleTweetCreated(event: Event) {
  const { tweet } = event.payload;
  const authorFollowers = followers.get(tweet.authorId) || new Set();
  
  // Send to all followers' timelines
  for (const followerId of authorFollowers) {
    const timelineEvent: Event = {
      ...event,
      id: uuidv4(),
      userId: followerId
    };
    
    await redisService.publishEvent(`timeline:${followerId}`, timelineEvent);
  }
  
  console.log(`📤 Tweet ${tweet.id} sent to ${authorFollowers.size} followers`);
}

async function handleTweetLiked(event: Event) {
  const { tweetId, likedBy } = event.payload;
  const tweet = tweets.get(tweetId);
  
  if (tweet) {
    // Notify tweet author
    const notificationEvent: Event = {
      id: uuidv4(),
      type: EventType.TWEET_LIKED,
      payload: { tweetId, likedBy, tweet },
      userId: tweet.authorId,
      timestamp: new Date(),
      version: 1
    };
    
    await redisService.publishEvent(`notifications:${tweet.authorId}`, notificationEvent);
  }
}

async function handleUserFollowed(event: Event) {
  const { followerId, followeeId } = event.payload;
  
  // Add to followers map
  if (!followers.has(followeeId)) {
    followers.set(followeeId, new Set());
  }
  followers.get(followeeId)!.add(followerId);
  
  console.log(`👥 User ${followerId} now follows ${followeeId}`);
}

// API Routes
app.post('/api/tweets', async (req, res) => {
  try {
    const { content, authorId } = req.body;
    const author = users.get(authorId);
    
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    const tweet: Tweet = {
      id: uuidv4(),
      content,
      authorId,
      authorUsername: author.username,
      createdAt: new Date(),
      likesCount: 0,
      retweetsCount: 0
    };

    tweets.set(tweet.id, tweet);

    // Create event
    const event: Event = {
      id: uuidv4(),
      type: EventType.TWEET_CREATED,
      payload: { tweet },
      userId: authorId,
      timestamp: new Date(),
      version: 1
    };

    // Publish event for real-time processing
    await redisService.publishEvent('tweet_events', event);

    res.json({ tweet, event });
  } catch (error) {
    console.error('Error creating tweet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/tweets/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const tweet = tweets.get(id);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    tweet.likesCount++;
    tweets.set(id, tweet);

    const event: Event = {
      id: uuidv4(),
      type: EventType.TWEET_LIKED,
      payload: { tweetId: id, likedBy: userId },
      userId,
      timestamp: new Date(),
      version: 1
    };

    await redisService.publishEvent('tweet_events', event);

    res.json({ tweet, event });
  } catch (error) {
    console.error('Error liking tweet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users/:id/follow', async (req, res) => {
  try {
    const { id: followeeId } = req.params;
    const { followerId } = req.body;

    const event: Event = {
      id: uuidv4(),
      type: EventType.USER_FOLLOWED,
      payload: { followerId, followeeId },
      userId: followerId,
      timestamp: new Date(),
      version: 1
    };

    await redisService.publishEvent('tweet_events', event);

    res.json({ event });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/timeline/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Try cache first
    const cached = await redisService.getTimeline(userId);
    if (cached) {
      return res.json({ tweets: cached, source: 'cache' });
    }

    // Generate timeline from user's followed accounts
    const userFollowing = followers.get(userId) || new Set();
    const timelineTweets = Array.from(tweets.values())
      .filter(tweet => tweet.authorId === userId || userFollowing.has(tweet.authorId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);

    // Cache timeline
    await redisService.cacheTimeline(userId, timelineTweets);

    res.json({ tweets: timelineTweets, source: 'generated' });
  } catch (error) {
    console.error('Error getting timeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/events/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const since = req.query.since ? new Date(req.query.since as string) : undefined;
    
    const events = await eventStore.getEventsByUser(userId, since);
    res.json({ events });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const onlineUsers = await redisService.getOnlineUsers();
    const stats = {
      totalUsers: users.size,
      totalTweets: tweets.size,
      totalEvents: eventStore.getTotalEvents(),
      onlineUsers: onlineUsers.length,
      activeConnections: wsService ? wsService.getActiveConnections() : 0,
      uptime: process.uptime()
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create sample users and data
function createSampleData() {
  // Sample users
  const sampleUsers: User[] = [
    { id: 'user1', username: 'alice_dev', email: 'alice@example.com', createdAt: new Date() },
    { id: 'user2', username: 'bob_codes', email: 'bob@example.com', createdAt: new Date() },
    { id: 'user3', username: 'charlie_tech', email: 'charlie@example.com', createdAt: new Date() },
  ];

  sampleUsers.forEach(user => users.set(user.id, user));

  // Set up some follow relationships
  followers.set('user1', new Set(['user2', 'user3']));
  followers.set('user2', new Set(['user1']));
  followers.set('user3', new Set(['user1', 'user2']));

  console.log('✅ Sample data created');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  if (wsService) wsService.close();
  await redisService.disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    createSampleData();
    
    app.listen(PORT, () => {
      console.log(`🚀 HTTP Server running on port ${PORT}`);
      console.log(`🔗 WebSocket Server running on port ${WS_PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();
