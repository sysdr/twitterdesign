import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { redis } from '../config/database.js';
import { config } from '../config/config.js';

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
  private accessTokenSecret = config.jwt.secret;
  private refreshTokenSecret = config.jwt.secret; // Using same secret for both
  private accessTokenExpiry: StringValue = config.jwt.expiresIn as StringValue;
  private refreshTokenExpiry: StringValue = '7d';
  private trustedDeviceRefreshExpiry: StringValue = '30d';

  generateTokens(payload: JWTPayload, isTrustedDevice = false): TokenPair {
    const accessTokenOptions: jwt.SignOptions = {
      expiresIn: this.accessTokenExpiry,
    };

    const refreshTokenOptions: jwt.SignOptions = {
      expiresIn: isTrustedDevice ? this.trustedDeviceRefreshExpiry : this.refreshTokenExpiry,
    };

    const accessToken = jwt.sign(payload, this.accessTokenSecret, accessTokenOptions);
    const refreshToken = jwt.sign(payload, this.refreshTokenSecret, refreshTokenOptions);

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
