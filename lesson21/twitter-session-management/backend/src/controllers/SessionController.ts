import { Router, Request, Response } from 'express';
import { SessionManager } from '../session/SessionManager';

export class SessionController {
  public router = Router();

  constructor(private sessionManager: SessionManager) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/info', this.getSessionInfo.bind(this));
    this.router.get('/stats', this.getSessionStats.bind(this));
    this.router.delete('/revoke', this.revokeSession.bind(this));
  }

  private async getSessionInfo(req: Request, res: Response): Promise<void> {
    try {
      const session = (req as any).session;
      res.json({
        success: true,
        session: {
          userId: session.userId,
          email: session.email,
          region: session.region,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          permissions: session.permissions
        }
      });
    } catch (error) {
      console.error('Session info error:', error);
      res.status(500).json({ error: 'Failed to get session info' });
    }
  }

  private async getSessionStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.sessionManager.getSessionStats();
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Session stats error:', error);
      res.status(500).json({ error: 'Failed to get session stats' });
    }
  }

  private async revokeSession(req: Request, res: Response): Promise<void> {
    try {
      const session = (req as any).session;
      await this.sessionManager.revokeSession(session.sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error('Session revoke error:', error);
      res.status(500).json({ error: 'Failed to revoke session' });
    }
  }
}
