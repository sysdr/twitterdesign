import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { SimpleRedisManager } from '../redis/SimpleRedisManager';

export interface SessionData {
  userId: string;
  sessionId: string;
  email: string;
  region: string;
  deviceId?: string;
  createdAt: Date;
  lastActivity: Date;
  permissions: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class SessionManager {
  private readonly SESSION_PREFIX = 'session:';
  private readonly BLACKLIST_PREFIX = 'blacklist:';
  private readonly REFRESH_PREFIX = 'refresh:';

  constructor(private redisManager: SimpleRedisManager) {}

  async createSession(userId: string, email: string, region: string = 'us-east'): Promise<TokenPair> {
    const sessionId = uuidv4();
    const deviceId = uuidv4();
    
    const sessionData: SessionData = {
      userId,
      sessionId,
      email,
      region,
      deviceId,
      createdAt: new Date(),
      lastActivity: new Date(),
      permissions: ['user:read', 'user:write', 'tweet:create']
    };

    // Store session data
    await this.redisManager.set(
      `${this.SESSION_PREFIX}${sessionId}`,
      JSON.stringify(sessionData),
      1800 // 30 minutes
    );

    // Generate tokens
    const accessToken = this.generateAccessToken(sessionData);
    const refreshToken = this.generateRefreshToken(sessionId);

    // Store refresh token
    await this.redisManager.set(
      `${this.REFRESH_PREFIX}${sessionId}`,
      refreshToken,
      30 * 24 * 60 * 60 // 30 days
    );

    return { accessToken, refreshToken };
  }

  async validateSession(token: string): Promise<SessionData | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Check blacklist
      const isBlacklisted = await this.redisManager.exists(`${this.BLACKLIST_PREFIX}${decoded.jti}`);
      if (isBlacklisted) return null;

      // Get session data
      const sessionData = await this.redisManager.get(`${this.SESSION_PREFIX}${decoded.sessionId}`);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData) as SessionData;
      
      // Update last activity
      session.lastActivity = new Date();
      await this.redisManager.set(
        `${this.SESSION_PREFIX}${decoded.sessionId}`,
        JSON.stringify(session),
        1800
      );

      return session;
    } catch (error) {
      return null;
    }
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      // Check if refresh token exists
      const storedToken = await this.redisManager.get(`${this.REFRESH_PREFIX}${decoded.sessionId}`);
      if (storedToken !== refreshToken) return null;

      // Get session data
      const sessionData = await this.redisManager.get(`${this.SESSION_PREFIX}${decoded.sessionId}`);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData) as SessionData;
      
      // Generate new tokens
      const newAccessToken = this.generateAccessToken(session);
      const newRefreshToken = this.generateRefreshToken(decoded.sessionId);

      // Update refresh token
      await this.redisManager.set(
        `${this.REFRESH_PREFIX}${decoded.sessionId}`,
        newRefreshToken,
        30 * 24 * 60 * 60
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      return null;
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    // Add to blacklist
    await this.redisManager.set(`${this.BLACKLIST_PREFIX}${sessionId}`, '1', 1800);
    
    // Remove session data
    await this.redisManager.del(`${this.SESSION_PREFIX}${sessionId}`);
    await this.redisManager.del(`${this.REFRESH_PREFIX}${sessionId}`);
  }

  private generateAccessToken(sessionData: SessionData): string {
    const payload = {
      userId: sessionData.userId,
      sessionId: sessionData.sessionId,
      email: sessionData.email,
      region: sessionData.region,
      permissions: sessionData.permissions,
      jti: uuidv4()
    };
    const secret = process.env.JWT_SECRET!;
    const options = { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as any;
    return jwt.sign(payload, secret, options);
  }

  private generateRefreshToken(sessionId: string): string {
    const payload = { sessionId, jti: uuidv4() };
    const secret = process.env.JWT_REFRESH_SECRET!;
    const options = { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } as any;
    return jwt.sign(payload, secret, options);
  }

  async getSessionStats(): Promise<any> {
    // This would typically aggregate from all cluster nodes
    return {
      activeSessions: 42, // Mock data for demo
      regions: {
        'us-east': 15,
        'eu-west': 18,
        'asia-pacific': 9
      },
      lastHour: {
        logins: 156,
        logouts: 23,
        refreshes: 89
      }
    };
  }
}
