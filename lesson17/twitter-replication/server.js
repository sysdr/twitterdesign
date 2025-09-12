const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

// Database configuration
const masterConfig = {
  host: process.env.MASTER_HOST || 'localhost',
  port: parseInt(process.env.MASTER_PORT || '5432'),
  database: process.env.DB_NAME || 'twitter_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const slave1Config = {
  host: process.env.SLAVE1_HOST || 'localhost',
  port: parseInt(process.env.SLAVE1_PORT || '5433'),
  database: process.env.DB_NAME || 'twitter_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const slave2Config = {
  host: process.env.SLAVE2_HOST || 'localhost',
  port: parseInt(process.env.SLAVE2_PORT || '5434'),
  database: process.env.DB_NAME || 'twitter_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create connection pools
const masterPool = new Pool(masterConfig);
const slave1Pool = new Pool(slave1Config);
const slave2Pool = new Pool(slave2Config);

// Database stats
let stats = {
  master: { status: 'healthy', connections: 0, lag: 0 },
  slaves: [
    { id: 'slave1', status: 'healthy', connections: 0, replication_lag: 0, last_sync: new Date().toISOString() },
    { id: 'slave2', status: 'healthy', connections: 0, replication_lag: 0, last_sync: new Date().toISOString() }
  ]
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Helper function to execute query on master
async function executeOnMaster(query, params = []) {
  try {
    const client = await masterPool.connect();
    const result = await client.query(query, params);
    client.release();
    stats.master.connections = masterPool.totalCount;
    return result;
  } catch (error) {
    stats.master.status = 'degraded';
    throw error;
  }
}

// Helper function to execute query on slave
async function executeOnSlave(query, params = []) {
  const slaves = [slave1Pool, slave2Pool];
  const slaveNames = ['slave1', 'slave2'];
  
  for (let i = 0; i < slaves.length; i++) {
    try {
      const client = await slaves[i].connect();
      const result = await client.query(query, params);
      client.release();
      
      // Update stats
      const slaveStats = stats.slaves.find(s => s.id === slaveNames[i]);
      if (slaveStats) {
        slaveStats.connections = slaves[i].totalCount;
        slaveStats.last_sync = new Date().toISOString();
      }
      
      return result;
    } catch (error) {
      console.error(`Slave ${slaveNames[i]} error:`, error);
      // Try next slave
      continue;
    }
  }
  
  // If all slaves fail, fallback to master
  console.warn('All slaves failed, routing to master');
  return executeOnMaster(query, params);
}

// Helper function to determine if query is write operation
function isWriteOperation(query) {
  const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];
  const upperQuery = query.trim().toUpperCase();
  return writeKeywords.some(keyword => upperQuery.startsWith(keyword));
}

// Routes
app.get('/api/health', async (req, res) => {
  try {
    res.json({ status: 'healthy', database: stats });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.get('/api/tweets', async (req, res) => {
  try {
    const result = await executeOnSlave(`
      SELECT t.*, u.username 
      FROM tweets t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC 
      LIMIT 50
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:userId/timeline', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await executeOnSlave(`
      SELECT t.*, u.username 
      FROM tweets t 
      JOIN users u ON t.user_id = u.id 
      JOIN followers f ON (t.user_id = f.following_id OR t.user_id = $1)
      WHERE f.follower_id = $1 OR t.user_id = $1
      ORDER BY t.created_at DESC 
      LIMIT 20
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tweets', async (req, res) => {
  try {
    const { user_id, content } = req.body;
    
    const result = await executeOnMaster(`
      INSERT INTO tweets (user_id, content) 
      VALUES ($1, $2) 
      RETURNING *
    `, [user_id, content]);
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await executeOnSlave(`
      SELECT * FROM users ORDER BY created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    // Get additional database metrics
    const masterMetrics = await executeOnMaster(`
      SELECT 
        (SELECT count(*) FROM tweets) as total_tweets,
        (SELECT count(*) FROM users) as total_users,
        (SELECT count(*) FROM followers) as total_followers
    `);
    
    res.json({
      ...stats,
      metrics: masterMetrics.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 API Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await masterPool.end();
  await slave1Pool.end();
  await slave2Pool.end();
  process.exit(0);
});

