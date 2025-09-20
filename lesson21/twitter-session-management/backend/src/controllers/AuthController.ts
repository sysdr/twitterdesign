import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { SessionManager } from '../session/SessionManager';

export class AuthController {
  public router = Router();

  constructor(private sessionManager: SessionManager) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/login', this.login.bind(this));
    this.router.post('/logout', this.logout.bind(this));
    this.router.post('/refresh', this.refresh.bind(this));
    this.router.post('/register', this.register.bind(this));
  }

  private async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, region = 'us-east' } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password required' });
        return;
      }

      // Mock user validation (replace with real DB lookup)
      const isValidUser = await this.validateUser(email, password);
      if (!isValidUser) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const userId = `user_${Date.now()}`;
      const tokens = await this.sessionManager.createSession(userId, email, region);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.json({
        success: true,
        user: { userId, email, region },
        accessToken: tokens.accessToken
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  private async logout(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = (req as any).session?.sessionId;
      if (sessionId) {
        await this.sessionManager.revokeSession(sessionId);
      }
      
      res.clearCookie('refreshToken');
      res.json({ success: true });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  private async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token required' });
        return;
      }

      const tokens = await this.sessionManager.refreshTokens(refreshToken);
      if (!tokens) {
        res.status(401).json({ error: 'Invalid refresh token' });
        return;
      }

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.json({
        success: true,
        accessToken: tokens.accessToken
      });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }

  private async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, region = 'us-east' } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password required' });
        return;
      }

      // Mock registration (replace with real DB operations)
      const userId = `user_${Date.now()}`;
      const tokens = await this.sessionManager.createSession(userId, email, region);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      res.status(201).json({
        success: true,
        user: { userId, email, region },
        accessToken: tokens.accessToken
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  private async validateUser(email: string, password: string): Promise<boolean> {
    // Mock validation - replace with real database lookup
    return email.includes('@') && password.length >= 6;
  }
}
