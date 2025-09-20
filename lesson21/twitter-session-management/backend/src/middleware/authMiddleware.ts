import { Request, Response, NextFunction } from 'express';
import { SessionManager } from '../session/SessionManager';

export function authMiddleware(sessionManager: SessionManager) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authorization token required' });
        return;
      }

      const token = authHeader.substring(7);
      const session = await sessionManager.validateSession(token);

      if (!session) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }

      (req as any).session = session;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };
}
