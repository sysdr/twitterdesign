const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { v4: uuidv4 } = require('uuid');

const { setupKafka } = require('./services/kafkaService');
const TweetProducer = require('./producers/tweetProducer');
const TweetConsumer = require('./consumers/tweetConsumer');
const MetricsService = require('./services/metricsService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Initialize services
let tweetProducer;
let tweetConsumer;
let metricsService;

async function initializeServices() {
  try {
    console.log('🚀 Initializing Kafka services...');
    
    // Setup Kafka topics
    await setupKafka();
    
    // Initialize services
    tweetProducer = new TweetProducer();
    tweetConsumer = new TweetConsumer();
    metricsService = new MetricsService();
    
    // Start services
    await tweetProducer.start();
    await tweetConsumer.start();
    await metricsService.start();
    
    // Setup consumers with Socket.IO
    tweetConsumer.onTweetReceived((tweet) => {
      io.emit('tweet-received', tweet);
      metricsService.recordMessage();
    });
    
    // Emit metrics updates
    setInterval(() => {
      const metrics = metricsService.getMetrics();
      io.emit('metrics-update', metrics);
    }, 1000);
    
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('publish-tweet', async (tweetData) => {
    try {
      const tweet = {
        id: uuidv4(),
        userId: tweetData.userId,
        username: tweetData.username,
        content: tweetData.content,
        timestamp: Date.now()
      };
      
      await tweetProducer.publishTweet(tweet);
      console.log('Tweet published:', tweet.id);
    } catch (error) {
      console.error('Error publishing tweet:', error);
      socket.emit('error', { message: 'Failed to publish tweet' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const metrics = metricsService ? metricsService.getMetrics() : null;
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    metrics
  });
});

// API Routes
app.get('/api/metrics', (req, res) => {
  if (!metricsService) {
    return res.status(503).json({ error: 'Metrics service not available' });
  }
  res.json(metricsService.getMetrics());
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Gracefully shutting down...');
  
  if (tweetProducer) await tweetProducer.stop();
  if (tweetConsumer) await tweetConsumer.stop();
  if (metricsService) await metricsService.stop();
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3001;

initializeServices().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Socket.IO server ready for connections`);
  });
});
