import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, AuthenticatedRequest } from '../types';

// Mock user database
const users: User[] = [
  {
    id: '1',
    username: 'johndoe',
    email: 'john@example.com',
    verified: true,
    createdAt: new Date(),
    tier: 'verified'
  },
  {
    id: '2', 
    username: 'janedoe',
    email: 'jane@example.com',
    verified: false,
    createdAt: new Date(),
    tier: 'basic'
  }
];

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = users.find(u => u.id === decoded.userId);
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Ignore invalid tokens for optional auth
    }
  }
  
  next();
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '24h' });
};
