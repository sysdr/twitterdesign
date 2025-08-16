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
