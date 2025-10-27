import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { SearchController } from './controllers/SearchController';
import { SearchService } from './services/SearchService';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Controllers
const searchController = new SearchController();
const searchService = new SearchService();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/search', searchController.search);
app.get('/api/suggest', searchController.suggest);
app.get('/api/trending', searchController.trending);

// Initialize search index and start server
async function startServer() {
  try {
    await searchService.initializeIndex();
    
    // Generate sample data
    await generateSampleTweets();
    
    app.listen(PORT, () => {
      logger.info(`🚀 Twitter Search API running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function generateSampleTweets() {
  const sampleTweets = [];
  const hashtags = ['#javascript', '#react', '#nodejs', '#programming', '#webdev', '#coding', '#tech', '#ai', '#ml'];
  const users = [
    { id: '1', username: 'techguru', displayName: 'Tech Guru', verified: true, followerCount: 50000 },
    { id: '2', username: 'codequeen', displayName: 'Code Queen', verified: false, followerCount: 25000 },
    { id: '3', username: 'devmaster', displayName: 'Dev Master', verified: true, followerCount: 100000 }
  ];

  for (let i = 0; i < 1000; i++) {
    const author = users[Math.floor(Math.random() * users.length)];
    const selectedHashtags = hashtags.slice(0, Math.floor(Math.random() * 3) + 1);
    
    sampleTweets.push({
      id: `tweet_${i}`,
      content: `Sample tweet ${i} talking about ${selectedHashtags.join(' ')} and modern web development trends`,
      author,
      hashtags: selectedHashtags,
      mentions: Math.random() > 0.7 ? [`@user${Math.floor(Math.random() * 100)}`] : [],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      engagementScore: Math.random() * 100,
      retweets: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 5000),
      replies: Math.floor(Math.random() * 500),
      isVerified: author.verified,
      sentiment: Math.random() > 0.3 ? 'positive' : Math.random() > 0.5 ? 'neutral' : 'negative',
      language: 'en'
    });
  }

  try {
    await searchService.bulkIndexTweets(sampleTweets);
    logger.info('Sample tweets indexed successfully');
  } catch (error) {
    logger.error('Failed to index sample tweets:', error);
  }
}

startServer();
