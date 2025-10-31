import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      username: string;
      verified?: boolean;
    };
  }
}

