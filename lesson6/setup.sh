#!/bin/bash

# Twitter Authentication System Implementation Script
# Lesson 6: User Authentication and Security

set -e  # Exit on any error

echo "🚀 Starting Twitter Authentication System Implementation..."

# Create project structure
echo "📁 Creating project structure..."
mkdir -p twitter-auth-system/{frontend,backend,database,tests,scripts,docs}
cd twitter-auth-system

# Frontend structure
mkdir -p frontend/{src/{components,services,hooks,types,utils,store},public}
mkdir -p frontend/src/components/{auth,ui,layout}

# Backend structure  
mkdir -p backend/{src/{controllers,middleware,services,models,routes,utils,config},tests}

# Database structure
mkdir -p database/{migrations,seeds}

echo "📦 Creating package.json files..."

# Frontend package.json
cat > frontend/package.json << 'EOF'
{
  "name": "twitter-auth-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "axios": "^1.7.2",
    "react-router-dom": "^6.23.1",
    "react-hook-form": "^7.52.0",
    "react-query": "^3.39.3",
    "zustand": "^4.5.2",
    "tailwindcss": "^3.4.4",
    "lucide-react": "^0.394.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.2",
    "vite": "^5.3.1",
    "vitest": "^1.6.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38"
  }
}
EOF

# Backend package.json
cat > backend/package.json << 'EOF'
{
  "name": "twitter-auth-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "express": "^4.19.2",
    "express-rate-limit": "^7.3.1",
    "express-validator": "^7.1.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "redis": "^4.6.14",
    "pg": "^8.12.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/pg": "^8.11.6",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "@types/compression": "^1.7.5",
    "typescript": "^5.5.2",
    "nodemon": "^3.1.4",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.12",
    "ts-jest": "^29.1.5",
    "ts-node": "^10.9.2"
  }
}
EOF

# Root package.json for orchestration
cat > package.json << 'EOF'
{
  "name": "twitter-auth-system",
  "version": "1.0.0",
  "scripts": {
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "cd backend && npm run build && cd ../frontend && npm run build",
    "test": "cd backend && npm test && cd ../frontend && npm test",
    "start": "cd backend && npm start"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF

echo "🔧 Installing dependencies..."
npm install

cd frontend && npm install && cd ..
cd backend && npm install && cd ..

echo "⚙️  Creating configuration files..."

# Environment configuration
cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://twitter_user:twitter_pass@localhost:5432/twitter_auth
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Server Configuration
PORT=3001
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
EOF

# Frontend Vite config
cat > frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
EOF

# Frontend TypeScript config
cat > frontend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Backend TypeScript config
cat > backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF

# Tailwind config
cat > frontend/tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        twitter: {
          blue: '#1DA1F2',
          darkblue: '#0d8bd9',
          lightblue: '#e8f5fd',
          dark: '#14171a',
          gray: '#657786',
          lightgray: '#aab8c2',
          extralightgray: '#e1e8ed'
        }
      }
    },
  },
  plugins: [],
}
EOF

echo "🏗️  Creating backend implementation..."

# Database models
cat > backend/src/models/User.ts << 'EOF'
export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  device_fingerprint?: string;
  is_trusted_device: boolean;
  expires_at: Date;
  created_at: Date;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceFingerprint?: string;
}
EOF

# Database connection
cat > backend/src/config/database.ts << 'EOF'
import { Pool } from 'pg';
import { createClient } from 'redis';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const redis = createClient({
  url: process.env.REDIS_URL
});

redis.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  await redis.connect();
  console.log('Connected to Redis');
};

export { pool, redis };
EOF

# JWT Service
cat > backend/src/services/jwtService.ts << 'EOF'
import jwt from 'jsonwebtoken';
import { redis } from '../config/database.js';

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class JWTService {
  private accessTokenSecret = process.env.JWT_SECRET!;
  private refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
  private accessTokenExpiry = '15m';
  private refreshTokenExpiry = '7d';
  private trustedDeviceRefreshExpiry = '30d';

  generateTokens(payload: JWTPayload, isTrustedDevice = false): TokenPair {
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: isTrustedDevice ? this.trustedDeviceRefreshExpiry : this.refreshTokenExpiry,
    });

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.accessTokenSecret) as JWTPayload;
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as JWTPayload;
    } catch {
      return null;
    }
  }

  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    await redis.setEx(`blacklist:${token}`, expiresIn, 'true');
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await redis.get(`blacklist:${token}`);
    return result === 'true';
  }
}

export default new JWTService();
EOF

# Rate limiting service
cat > backend/src/services/rateLimitService.ts << 'EOF'
import { redis } from '../config/database.js';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
}

class RateLimitService {
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `${config.keyPrefix}:${identifier}`;
    const windowStart = Math.floor(Date.now() / config.windowMs) * config.windowMs;
    const windowKey = `${key}:${windowStart}`;

    const pipeline = redis.multi();
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    const currentCount = results?.[0]?.[1] as number;

    const allowed = currentCount <= config.maxRequests;
    const remainingRequests = Math.max(0, config.maxRequests - currentCount);
    const resetTime = windowStart + config.windowMs;

    return {
      allowed,
      remainingRequests,
      resetTime
    };
  }

  async getUserRateLimit(userId: string): Promise<RateLimitResult> {
    return this.checkRateLimit(userId, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 300,
      keyPrefix: 'user_limit'
    });
  }

  async getIPRateLimit(ip: string): Promise<RateLimitResult> {
    return this.checkRateLimit(ip, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      keyPrefix: 'ip_limit'
    });
  }

  async getEndpointRateLimit(userId: string, endpoint: string): Promise<RateLimitResult> {
    const configs: Record<string, RateLimitConfig> = {
      '/auth/login': {
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
        keyPrefix: 'login_limit'
      },
      '/auth/register': {
        windowMs: 60 * 60 * 1000,
        maxRequests: 3,
        keyPrefix: 'register_limit'
      },
      '/tweets': {
        windowMs: 3 * 60 * 60 * 1000,
        maxRequests: 300,
        keyPrefix: 'tweet_limit'
      }
    };

    const config = configs[endpoint] || {
      windowMs: 15 * 60 * 1000,
      maxRequests: 60,
      keyPrefix: 'default_limit'
    };

    return this.checkRateLimit(`${userId}:${endpoint}`, config);
  }
}

export default new RateLimitService();
EOF

# Authentication service
cat > backend/src/services/authService.ts << 'EOF'
import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { User, CreateUserRequest, LoginRequest, RefreshToken } from '../models/User.js';
import jwtService, { JWTPayload } from './jwtService.js';
import { v4 as uuidv4 } from 'uuid';

class AuthService {
  async register(userData: CreateUserRequest): Promise<{ user: User; tokens: any }> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const result = await pool.query(
      `INSERT INTO users (id, email, username, password_hash) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [uuidv4(), userData.email, userData.username, hashedPassword]
    );

    const user = result.rows[0];
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username
    };

    const tokens = jwtService.generateTokens(payload);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user, tokens };
  }

  async login(loginData: LoginRequest): Promise<{ user: User; tokens: any } | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [loginData.email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(loginData.password, user.password_hash);

    if (!isValidPassword) {
      return null;
    }

    // Check if device is trusted
    const isTrustedDevice = await this.isTrustedDevice(user.id, loginData.deviceFingerprint);

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username
    };

    const tokens = jwtService.generateTokens(payload, isTrustedDevice);
    await this.storeRefreshToken(user.id, tokens.refreshToken, loginData.deviceFingerprint, isTrustedDevice);

    return { user, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<{ tokens: any } | null> {
    const payload = jwtService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    // Check if refresh token exists in database
    const tokenResult = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return null;
    }

    const tokenData = tokenResult.rows[0];
    const tokens = jwtService.generateTokens(payload, tokenData.is_trusted_device);

    // Update refresh token in database
    await pool.query(
      'UPDATE refresh_tokens SET token = $1 WHERE id = $2',
      [tokens.refreshToken, tokenData.id]
    );

    return { tokens };
  }

  async logout(refreshToken: string): Promise<void> {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
  }

  private async storeRefreshToken(
    userId: string, 
    token: string, 
    deviceFingerprint?: string,
    isTrustedDevice = false
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (isTrustedDevice ? 30 : 7));

    await pool.query(
      `INSERT INTO refresh_tokens (id, user_id, token, device_fingerprint, is_trusted_device, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), userId, token, deviceFingerprint, isTrustedDevice, expiresAt]
    );
  }

  private async isTrustedDevice(userId: string, deviceFingerprint?: string): Promise<boolean> {
    if (!deviceFingerprint) return false;

    const result = await pool.query(
      'SELECT * FROM trusted_devices WHERE user_id = $1 AND device_fingerprint = $2',
      [userId, deviceFingerprint]
    );

    return result.rows.length > 0;
  }
}

export default new AuthService();
EOF

# Input validation middleware
cat > backend/src/middleware/validation.ts << 'EOF'
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters, alphanumeric and underscore only'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  next();
};
EOF

# Rate limiting middleware
cat > backend/src/middleware/rateLimiting.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import rateLimitService from '../services/rateLimitService.js';

export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = (req as any).user?.userId;

    // Check IP rate limit
    const ipLimit = await rateLimitService.getIPRateLimit(ip);
    if (!ipLimit.allowed) {
      res.status(429).json({
        success: false,
        message: 'Too many requests from this IP',
        retryAfter: ipLimit.resetTime
      });
      return;
    }

    // Check user rate limit if authenticated
    if (userId) {
      const userLimit = await rateLimitService.getUserRateLimit(userId);
      if (!userLimit.allowed) {
        res.status(429).json({
          success: false,
          message: 'User rate limit exceeded',
          retryAfter: userLimit.resetTime
        });
        return;
      }

      // Check endpoint-specific rate limit
      const endpointLimit = await rateLimitService.getEndpointRateLimit(userId, req.path);
      if (!endpointLimit.allowed) {
        res.status(429).json({
          success: false,
          message: 'Endpoint rate limit exceeded',
          retryAfter: endpointLimit.resetTime
        });
        return;
      }
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': ipLimit.remainingRequests.toString(),
      'X-RateLimit-Reset': Math.ceil(ipLimit.resetTime / 1000).toString()
    });

    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    next(); // Continue on rate limiting errors
  }
};
EOF

# Authentication middleware
cat > backend/src/middleware/auth.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import jwtService from '../services/jwtService.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    // Check if token is blacklisted
    const isBlacklisted = await jwtService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: 'Token has been invalidated'
      });
      return;
    }

    const payload = jwtService.verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = jwtService.verifyAccessToken(token);
      if (payload) {
        req.user = payload;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
EOF

# Auth controller
cat > backend/src/controllers/authController.ts << 'EOF'
import { Request, Response } from 'express';
import authService from '../services/authService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.register(req.body);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username
        },
        tokens: result.tokens
      }
    });
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({
        success: false,
        message: 'Email or username already exists'
      });
      return;
    }

    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    
    if (!result) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username
        },
        tokens: result.tokens
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
      return;
    }

    const result = await authService.refreshTokens(refreshToken);
    
    if (!result) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: result.tokens
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
};
EOF

# Auth routes
cat > backend/src/routes/authRoutes.ts << 'EOF'
import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validateRegistration, validateLogin, handleValidationErrors } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rateLimiting.js';

const router = Router();

router.post('/register', 
  rateLimitMiddleware,
  validateRegistration, 
  handleValidationErrors, 
  authController.register
);

router.post('/login', 
  rateLimitMiddleware,
  validateLogin, 
  handleValidationErrors, 
  authController.login
);

router.post('/refresh', rateLimitMiddleware, authController.refreshToken);
router.post('/logout', rateLimitMiddleware, authController.logout);
router.get('/profile', authenticateToken, authController.getProfile);

export default router;
EOF

# Main server
cat > backend/src/server.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectRedis } from './config/database.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
  credentials: true
}));

// Utility middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
const startServer = async () => {
  try {
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
EOF

echo "🎨 Creating frontend implementation..."

# Frontend index.html
cat > frontend/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/twitter-icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Twitter Auth System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# Frontend main entry
cat > frontend/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# Frontend styles
cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer components {
  .btn-primary {
    @apply bg-twitter-blue hover:bg-twitter-darkblue text-white font-medium py-2 px-4 rounded-full transition-colors duration-200;
  }
  
  .btn-secondary {
    @apply bg-transparent hover:bg-twitter-lightblue text-twitter-blue border border-twitter-blue font-medium py-2 px-4 rounded-full transition-colors duration-200;
  }
  
  .input-field {
    @apply w-full px-4 py-3 border border-twitter-extralightgray rounded-lg focus:outline-none focus:ring-2 focus:ring-twitter-blue focus:border-transparent;
  }
}
EOF

# Auth store
cat > frontend/src/store/authStore.ts << 'EOF'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      updateTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
EOF

# API service
cat > frontend/src/services/api.ts << 'EOF'
import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '../store/authStore';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const { accessToken } = useAuthStore.getState();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const { refreshToken } = useAuthStore.getState();
            if (refreshToken) {
              const response = await this.refreshTokens(refreshToken);
              const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
              
              useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            useAuthStore.getState().clearAuth();
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async register(userData: { email: string; username: string; password: string }) {
    return this.api.post('/auth/register', userData);
  }

  async login(credentials: { email: string; password: string; deviceFingerprint?: string }) {
    return this.api.post('/auth/login', credentials);
  }

  async refreshTokens(refreshToken: string) {
    return this.api.post('/auth/refresh', { refreshToken });
  }

  async logout(refreshToken: string) {
    return this.api.post('/auth/logout', { refreshToken });
  }

  async getProfile() {
    return this.api.get('/auth/profile');
  }

  // Tweet-related endpoints (placeholder for integration)
  async getTweets() {
    return this.api.get('/tweets');
  }

  async createTweet(content: string) {
    return this.api.post('/tweets', { content });
  }
}

export default new ApiService();
EOF

# Device fingerprinting utility
cat > frontend/src/utils/deviceFingerprint.ts << 'EOF'
export const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Twitter Auth System', 10, 10);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};
EOF

# Auth hook
cat > frontend/src/hooks/useAuth.ts << 'EOF'
import { useMutation, useQuery } from 'react-query';
import { useAuthStore } from '../store/authStore';
import apiService from '../services/api';
import { generateDeviceFingerprint } from '../utils/deviceFingerprint';

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation(
    async (credentials: { email: string; password: string }) => {
      const deviceFingerprint = generateDeviceFingerprint();
      return apiService.login({ ...credentials, deviceFingerprint });
    },
    {
      onSuccess: (response) => {
        const { user, tokens } = response.data.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
      },
    }
  );

  const registerMutation = useMutation(
    (userData: { email: string; username: string; password: string }) =>
      apiService.register(userData),
    {
      onSuccess: (response) => {
        const { user, tokens } = response.data.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
      },
    }
  );

  const logoutMutation = useMutation(
    async () => {
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) {
        await apiService.logout(refreshToken);
      }
    },
    {
      onSuccess: () => {
        clearAuth();
      },
    }
  );

  const profileQuery = useQuery(
    'profile',
    () => apiService.getProfile(),
    {
      enabled: isAuthenticated,
      retry: false,
    }
  );

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isLoading,
    isRegistering: registerMutation.isLoading,
    isLoggingOut: logoutMutation.isLoading,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    profile: profileQuery.data?.data,
  };
};
EOF

# Login component
cat > frontend/src/components/auth/LoginForm.tsx << 'EOF'
import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const { login, isLoggingIn, loginError } = useAuth();

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-twitter-dark">Welcome back</h2>
        <p className="text-twitter-gray mt-2">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-twitter-dark mb-2">
            Email
          </label>
          <input
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Invalid email address'
              }
            })}
            className="input-field"
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-twitter-dark mb-2">
            Password
          </label>
          <input
            type="password"
            {...register('password', { required: 'Password is required' })}
            className="input-field"
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        {loginError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">
              {(loginError as any)?.response?.data?.message || 'Login failed'}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingIn ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};
EOF

# Register component
cat > frontend/src/components/auth/RegisterForm.tsx << 'EOF'
import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';

interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export const RegisterForm: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const { register: registerUser, isRegistering, registerError } = useAuth();

  const password = watch('password');

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerUser(registerData);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-twitter-dark">Join Twitter</h2>
        <p className="text-twitter-gray mt-2">Create your account today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-twitter-dark mb-2">
            Email
          </label>
          <input
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Invalid email address'
              }
            })}
            className="input-field"
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-twitter-dark mb-2">
            Username
          </label>
          <input
            type="text"
            {...register('username', { 
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters'
              },
              pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: 'Username can only contain letters, numbers, and underscores'
              }
            })}
            className="input-field"
            placeholder="Choose a username"
          />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-twitter-dark mb-2">
            Password
          </label>
          <input
            type="password"
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: 'Password must contain uppercase, lowercase, number and special character'
              }
            })}
            className="input-field"
            placeholder="Create a strong password"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-twitter-dark mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            {...register('confirmPassword', { 
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match'
            })}
            className="input-field"
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {registerError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">
              {(registerError as any)?.response?.data?.message || 'Registration failed'}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isRegistering}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRegistering ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>
  );
};
EOF

# Dashboard component
cat > frontend/src/components/Dashboard.tsx << 'EOF'
import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const Dashboard: React.FC = () => {
  const { user, logout, isLoggingOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-twitter-dark">Twitter Clone</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-twitter-gray">Welcome, {user?.username}!</span>
              <button
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="btn-secondary text-sm disabled:opacity-50"
              >
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-twitter-dark mb-4">Profile</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-twitter-gray">Username</label>
                  <p className="font-medium">{user?.username}</p>
                </div>
                <div>
                  <label className="text-sm text-twitter-gray">Email</label>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-twitter-gray">User ID</label>
                  <p className="font-mono text-sm text-twitter-gray">{user?.id}</p>
                </div>
              </div>
            </div>

            {/* Security Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-twitter-dark mb-4">Security Status</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-sm">Authentication Active</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-sm">Session Secured</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-sm">Rate Limiting Active</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-twitter-dark mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full btn-primary text-sm">
                  Compose Tweet
                </button>
                <button className="w-full btn-secondary text-sm">
                  View Timeline
                </button>
                <button className="w-full btn-secondary text-sm">
                  Security Settings
                </button>
              </div>
            </div>
          </div>

          {/* Authentication Demo */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-twitter-dark mb-4">
              Authentication System Demo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800">JWT Tokens</h4>
                <p className="text-sm text-green-600 mt-1">
                  Access and refresh tokens working correctly
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800">Rate Limiting</h4>
                <p className="text-sm text-blue-600 mt-1">
                  Multi-layer protection active
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800">Input Validation</h4>
                <p className="text-sm text-purple-600 mt-1">
                  SQL injection protection enabled
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-800">Session Management</h4>
                <p className="text-sm text-orange-600 mt-1">
                  Redis-backed secure sessions
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
EOF

# Main App component
cat > frontend/src/App.tsx << 'EOF'
import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Dashboard } from './components/Dashboard';

const queryClient = new QueryClient();

const AuthWrapper: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (isAuthenticated) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-twitter-lightblue to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? <LoginForm /> : <RegisterForm />}
        
        <div className="text-center mt-6">
          <p className="text-twitter-gray">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-twitter-blue hover:text-twitter-darkblue font-medium mt-1"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthWrapper />
    </QueryClientProvider>
  );
};

export default App;
EOF

echo "🗄️  Creating database setup..."

# Database schema
cat > database/init.sql << 'EOF'
-- Twitter Authentication System Database Schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_fingerprint TEXT,
    is_trusted_device BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trusted devices table
CREATE TABLE trusted_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_name VARCHAR(255),
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, device_fingerprint)
);

-- Security events table for audit logging
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO users (email, username, password_hash) VALUES 
('demo@twitter.com', 'demouser', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xWA8uqiYW'); -- password: demo123!

INSERT INTO security_events (event_type, success, details) VALUES 
('system_start', true, '{"message": "Authentication system initialized"}');
EOF

# Docker setup
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: twitter_auth
      POSTGRES_USER: twitter_user
      POSTGRES_PASSWORD: twitter_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U twitter_user -d twitter_auth"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
EOF

echo "🧪 Creating test files..."

# Backend tests
cat > backend/src/tests/auth.test.ts << 'EOF'
import request from 'supertest';
import app from '../server';

describe('Authentication Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'Test123!@#'
  };

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.tokens).toHaveProperty('accessToken');
    expect(response.body.data.tokens).toHaveProperty('refreshToken');
  });

  it('should login existing user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.tokens).toHaveProperty('accessToken');
  });

  it('should reject invalid credentials', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      })
      .expect(401);
  });

  it('should validate password requirements', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'weak@example.com',
        username: 'weakuser',
        password: 'weak'
      })
      .expect(400);
  });
});
EOF

# Frontend tests
cat > frontend/src/tests/auth.test.tsx << 'EOF'
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { LoginForm } from '../components/auth/LoginForm';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('LoginForm', () => {
  it('renders login form', () => {
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    renderWithProviders(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByText('Sign in');

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });
  });

  it('requires password', async () => {
    renderWithProviders(<LoginForm />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const submitButton = screen.getByText('Sign in');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });
});
EOF

echo "📝 Creating start and stop scripts..."

# Start script
cat > start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Twitter Authentication System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start database services
echo "📊 Starting database services..."
docker-compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for databases to be ready..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker-compose exec -T postgres pg_isready -U twitter_user -d twitter_auth > /dev/null 2>&1 && \
       docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Databases are ready!"
        break
    fi
    sleep 2
    timeout=$((timeout-2))
done

if [ $timeout -le 0 ]; then
    echo "❌ Databases failed to start within timeout"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build backend
echo "🔨 Building backend..."
cd backend && npm run build && cd ..

# Start services
echo "🌟 Starting development servers..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Run tests
echo "🧪 Running tests..."
cd backend && npm test && cd ..
cd frontend && npm test && cd ..

echo "✅ Twitter Authentication System is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo "📊 Health check: http://localhost:3001/api/health"

echo "🎯 Demo Credentials:"
echo "Email: demo@twitter.com"
echo "Password: demo123!"

echo "📋 Press Ctrl+C to stop all services"
wait $BACKEND_PID
EOF

# Stop script
cat > stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Twitter Authentication System..."

# Kill development servers
pkill -f "npm run dev"
pkill -f "vite"
pkill -f "nodemon"

# Stop Docker services
docker-compose down

echo "✅ All services stopped!"
EOF

chmod +x start.sh stop.sh

echo "🎉 Implementation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run ./start.sh to start the system"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Register a new account or use demo credentials:"
echo "   Email: demo@twitter.com"
echo "   Password: demo123!"
echo ""
echo "🔧 System features:"
echo "✅ JWT authentication with refresh tokens"
echo "✅ Multi-layer rate limiting"
echo "✅ SQL injection protection"
echo "✅ Device fingerprinting"
echo "✅ Redis session management"
echo "✅ Comprehensive testing"
echo ""
echo "🛑 To stop the system, run ./stop.sh"