import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import Redis from 'ioredis';
import { WebSocketServer } from 'ws';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AuthService } from './auth/AuthService.js';
import { AuthorizationService } from './authorization/AuthorizationService.js';
import { RateLimiter } from './ratelimit/RateLimiter.js';
import { AbuseDetectionService } from './abuse-detection/AbuseDetectionService.js';
import { SecurityEventLogger } from './utils/SecurityEventLogger.js';

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Services
const authService = new AuthService(redis);
const authzService = new AuthorizationService(redis);
const rateLimiter = new RateLimiter(redis);
const abuseDetection = new AbuseDetectionService(redis);
const eventLogger = new SecurityEventLogger(redis);

// Middleware: Extract IP and User Agent
app.use((req, res, next) => {
  req.clientIp = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
  req.userAgent = req.headers['user-agent'] || 'Unknown';
  next();
});

// Middleware: Rate Limiting
app.use(async (req, res, next) => {
  const ipLimit = await rateLimiter.checkIPLimit(req.clientIp);
  
  if (!ipLimit.allowed) {
    await eventLogger.logEvent('rate_limit_exceeded', req.clientIp, req.userAgent);
    return res.status(429).json({ error: 'Too many requests' });
  }

  res.setHeader('X-RateLimit-Remaining', ipLimit.remaining.toString());
  next();
});

// Middleware: JWT Verification
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const payload = authService.verifyAccessToken(token);

  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
};

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await authService.register(username, email, password);
    
    await eventLogger.logEvent('login_attempt', req.clientIp, req.userAgent, user.id, { type: 'registration' });

    res.json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    await eventLogger.logEvent('login_attempt', req.clientIp, req.userAgent, undefined, { email });

    const result = await authService.login(email, password, req.clientIp, req.userAgent);

    if (!result) {
      await eventLogger.logEvent('failed_login', req.clientIp, req.userAgent, undefined, { email });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Calculate threat score asynchronously
    abuseDetection.calculateThreatScore(result.user.id, req.userAgent, req.clientIp);
    abuseDetection.recordUserAction(result.user.id, 'login', { ipAddress: req.clientIp });

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const result = await authService.refreshAccessToken(refreshToken, req.clientIp, req.userAgent);

    if (!result) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/threat-score', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(500).json({ error: 'User context missing' });
    }
    const threatScore = await abuseDetection.calculateThreatScore(req.user.userId, req.userAgent, req.clientIp);
    res.json(threatScore);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/security/events', authenticateToken, async (req: Request, res: Response) => {
  try {
    const events = await eventLogger.getRecentEvents(100);
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/security/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const stats = await eventLogger.getEventStats();
    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Serve frontend assets in production
app.use(express.static(frontendDistPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Security service running on port ${PORT}`);
});

// WebSocket for real-time security events
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to security feed');

  const interval = setInterval(async () => {
    const stats = await eventLogger.getEventStats();
    const recentEvents = await eventLogger.getRecentEvents(10);
    
    ws.send(JSON.stringify({
      type: 'security_update',
      stats,
      recentEvents
    }));
  }, 2000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    redis.disconnect();
    process.exit(0);
  });
});
