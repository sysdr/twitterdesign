import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { User, TokenPayload, RefreshToken } from '../types/index.js';
import UAParser from 'ua-parser-js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthService {
  private redis: Redis;
  private users: Map<string, User>; // In-memory for demo

  constructor(redis: Redis) {
    this.redis = redis;
    this.users = new Map();
  }

  async register(username: string, email: string, password: string): Promise<User> {
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);
    
    const user: User = {
      id: userId,
      username,
      email,
      passwordHash,
      createdAt: new Date(),
      isBlocked: false,
      riskScore: 0
    };

    this.users.set(userId, user);
    this.users.set(email, user); // Index by email too
    
    await this.redis.set(`user:${userId}`, JSON.stringify(user));
    
    return user;
  }

  async login(email: string, password: string, ipAddress: string, userAgent: string): Promise<{ accessToken: string; refreshToken: string; user: User } | null> {
    const user = this.users.get(email);
    
    if (!user) {
      await this.recordFailedLogin(email, ipAddress);
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      await this.recordFailedLogin(email, ipAddress);
      return null;
    }

    if (user.isBlocked) {
      throw new Error('Account is blocked due to security concerns');
    }

    // Check failed login attempts
    const attempts = await this.getFailedLoginAttempts(ipAddress, email);
    if (attempts >= 5) {
      throw new Error('Too many failed login attempts. Please try again later.');
    }

    // Clear failed attempts on successful login
    await this.clearFailedLoginAttempts(ipAddress, email);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id, ipAddress, userAgent);

    // Update last login
    user.lastLoginAt = new Date();
    this.users.set(user.id, user);
    await this.redis.set(`user:${user.id}`, JSON.stringify(user));

    return { accessToken, refreshToken, user };
  }

  generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60 // 15 minutes
    };

    return jwt.sign(payload, JWT_SECRET);
  }

  async generateRefreshToken(userId: string, ipAddress: string, userAgent: string): Promise<string> {
    const tokenId = uuidv4();
    const token = uuidv4();
    
    const refreshToken: RefreshToken = {
      id: tokenId,
      userId,
      token,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN),
      createdAt: new Date(),
      ipAddress,
      userAgent,
      isRevoked: false
    };

    await this.redis.setex(
      `refresh_token:${token}`,
      Math.floor(REFRESH_TOKEN_EXPIRES_IN / 1000),
      JSON.stringify(refreshToken)
    );

    // Track user sessions
    await this.redis.sadd(`user_sessions:${userId}`, token);

    return token;
  }

  async refreshAccessToken(refreshToken: string, ipAddress: string, userAgent: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    const tokenData = await this.redis.get(`refresh_token:${refreshToken}`);
    
    if (!tokenData) {
      return null;
    }

    const storedToken: RefreshToken = JSON.parse(tokenData);

    if (storedToken.isRevoked || new Date() > new Date(storedToken.expiresAt)) {
      return null;
    }

    // Get user
    const userData = await this.redis.get(`user:${storedToken.userId}`);
    if (!userData) {
      return null;
    }

    const user: User = JSON.parse(userData);

    // Revoke old refresh token (one-time use)
    await this.redis.del(`refresh_token:${refreshToken}`);
    await this.redis.srem(`user_sessions:${storedToken.userId}`, refreshToken);

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user.id, ipAddress, userAgent);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const tokenData = await this.redis.get(`refresh_token:${token}`);
    if (tokenData) {
      const storedToken: RefreshToken = JSON.parse(tokenData);
      await this.redis.del(`refresh_token:${token}`);
      await this.redis.srem(`user_sessions:${storedToken.userId}`, token);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const tokens = await this.redis.smembers(`user_sessions:${userId}`);
    const pipeline = this.redis.pipeline();
    
    tokens.forEach(token => {
      pipeline.del(`refresh_token:${token}`);
    });
    
    pipeline.del(`user_sessions:${userId}`);
    await pipeline.exec();
  }

  private async recordFailedLogin(identifier: string, ipAddress: string): Promise<void> {
    const ipKey = `failed_logins:ip:${ipAddress}`;
    const userKey = `failed_logins:user:${identifier}`;
    
    await this.redis.zincrby(ipKey, 1, identifier);
    await this.redis.expire(ipKey, 3600); // 1 hour TTL
    
    await this.redis.zincrby(userKey, 1, ipAddress);
    await this.redis.expire(userKey, 3600);
  }

  private async getFailedLoginAttempts(ipAddress: string, identifier: string): Promise<number> {
    const ipKey = `failed_logins:ip:${ipAddress}`;
    const userKey = `failed_logins:user:${identifier}`;
    
    const ipAttempts = await this.redis.zcard(ipKey);
    const userAttempts = await this.redis.zcard(userKey);
    
    return Math.max(ipAttempts, userAttempts);
  }

  private async clearFailedLoginAttempts(ipAddress: string, identifier: string): Promise<void> {
    await this.redis.del(`failed_logins:ip:${ipAddress}`);
    await this.redis.del(`failed_logins:user:${identifier}`);
  }
}
