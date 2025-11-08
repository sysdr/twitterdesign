import 'express';
import type { TokenPayload } from './index.js';

declare global {
  namespace Express {
    interface Request {
      clientIp: string;
      userAgent: string;
      user?: TokenPayload;
    }
  }
}

export {};

