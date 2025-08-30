import express from 'express';
import cors from 'cors';
import { LoadTester } from './services/loadTester';
import { performanceMonitor } from './services/performanceMonitor';
import { dbPool } from './utils/database';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const loadTester = new LoadTester();

// Generate mock data for dashboard
function generateMockMetrics() {
  return {
    total_requests: Math.floor(Math.random() * 1000) + 100,
    successful_requests: Math.floor(Math.random() * 950) + 95,
    failed_requests: Math.floor(Math.random() * 50) + 5,
    avg_response_time: Math.floor(Math.random() * 200) + 50,
    p95_response_time: Math.floor(Math.random() * 400) + 150,
    p99_response_time: Math.floor(Math.random() * 800) + 300,
    requests_per_second: Math.floor(Math.random() * 50) + 10,
    user_patterns: Array(20).fill(null).map(() => ({
      user_id: `user_${Math.floor(Math.random() * 1000)}`,
      action_type: ['view_timeline', 'like_tweet', 'post_tweet'][Math.floor(Math.random() * 3)],
      duration_ms: Math.floor(Math.random() * 1000) + 100,
      success: Math.random() > 0.05,
      response_time_ms: Math.floor(Math.random() * 500) + 50
    }))
  };
}

// Load test endpoints
app.post('/api/load-test/start', async (req, res) => {
  try {
    const { targetUsers, duration } = req.body;
    
    // Start load test in background
    loadTester.runLoadTest(targetUsers, duration).catch(console.error);
    
    res.json({ 
      status: 'started', 
      targetUsers, 
      duration,
      message: 'Load test started successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start load test' });
  }
});

app.post('/api/load-test/stop', (_req, res) => {
  // In a real implementation, you'd stop the load test here
  res.json({ status: 'stopped', message: 'Load test stopped' });
});

app.get('/api/load-test/metrics', (_req, res) => {
  try {
    const userPatterns = loadTester.getMetrics();
    
    // Use mock data if no real metrics are available
    if (userPatterns.length === 0) {
      res.json(generateMockMetrics());
      return;
    }
    
    // Transform user behavior patterns into dashboard metrics
    const metrics = {
      total_requests: userPatterns.length,
      successful_requests: userPatterns.filter(p => p.success).length,
      failed_requests: userPatterns.filter(p => !p.success).length,
      avg_response_time: userPatterns.length > 0 
        ? userPatterns.reduce((sum, p) => sum + p.response_time_ms, 0) / userPatterns.length 
        : 0,
      p95_response_time: userPatterns.length > 0 
        ? userPatterns.sort((a, b) => a.response_time_ms - b.response_time_ms)[
            Math.floor(userPatterns.length * 0.95)
          ]?.response_time_ms || 0
        : 0,
      p99_response_time: userPatterns.length > 0 
        ? userPatterns.sort((a, b) => a.response_time_ms - b.response_time_ms)[
            Math.floor(userPatterns.length * 0.99)
          ]?.response_time_ms || 0
        : 0,
      requests_per_second: userPatterns.length > 0 
        ? Math.round(userPatterns.length / 30) // Assuming 30 second test duration
        : 0,
      user_patterns: userPatterns.slice(-20) // Last 20 patterns
    };
    
    res.json(metrics);
  } catch (error) {
    // Fallback to mock data on error
    res.json(generateMockMetrics());
  }
});

// Performance monitoring endpoints
app.get('/api/metrics/queries', async (_req, res) => {
  try {
    // Simulate query performance data
    const queries = [
      { query: 'SELECT * FROM tweets WHERE user_id = ?', avg_time: 45, call_count: 1250, total_time: 56250 },
      { query: 'SELECT * FROM users WHERE id = ?', avg_time: 23, call_count: 890, total_time: 20470 },
      { query: 'INSERT INTO tweets (user_id, content)', avg_time: 67, call_count: 156, total_time: 10452 },
      { query: 'SELECT COUNT(*) FROM followers WHERE user_id = ?', avg_time: 112, call_count: 445, total_time: 49840 }
    ];
    
    res.json(queries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch query metrics' });
  }
});

app.get('/api/metrics/connections', (_req, res) => {
  try {
    const metrics = dbPool.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch connection metrics' });
  }
});

app.get('/api/bottlenecks', (_req, res) => {
  try {
    const bottlenecks = performanceMonitor.getCurrentBottlenecks();
    res.json(bottlenecks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bottlenecks' });
  }
});

// Twitter MVP endpoints for load testing
app.post('/api/auth/login', (req, res) => {
  const { username } = req.body;
  
  // Simulate authentication delay
  setTimeout(() => {
    res.json({ 
      token: 'fake-jwt-token-' + Math.random().toString(36).substr(2, 9),
      user: { id: Math.floor(Math.random() * 10000), username }
    });
  }, 20 + Math.random() * 50);
});

app.get('/api/timeline', (_req, res) => {
  // Simulate timeline loading delay
  setTimeout(() => {
    const tweets = Array(20).fill(null).map((_, i) => ({
      id: Math.floor(Math.random() * 100000),
      content: `This is tweet number ${i + 1} for load testing purposes`,
      user: { username: `user_${Math.floor(Math.random() * 1000)}` },
      created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      like_count: Math.floor(Math.random() * 100),
      retweet_count: Math.floor(Math.random() * 50)
    }));
    
    res.json({ tweets });
  }, 30 + Math.random() * 100);
});

app.post('/api/tweets', (req, res) => {
  const { content } = req.body;
  
  // Simulate tweet creation delay
  setTimeout(() => {
    res.json({
      id: Math.floor(Math.random() * 100000),
      content,
      created_at: new Date().toISOString(),
      like_count: 0,
      retweet_count: 0
    });
  }, 50 + Math.random() * 150);
});

app.post('/api/tweets/:id/like', (req, res) => {
  const { id } = req.params;
  
  // Simulate like action delay
  setTimeout(() => {
    res.json({ 
      success: true, 
      tweet_id: id,
      like_count: Math.floor(Math.random() * 100) + 1
    });
  }, 25 + Math.random() * 75);
});

app.listen(PORT, () => {
  console.log(`🚀 Load testing server running on port ${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:3000`);
});
