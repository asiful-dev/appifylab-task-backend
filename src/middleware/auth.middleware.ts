import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errorTypes.js';

export interface AuthUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Verify JWT access token
 */
export const authenticateToken = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return next(new UnauthorizedError('Missing access token'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET!) as any;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Access token expired'));
    }
    next(new UnauthorizedError('Invalid access token'));
  }
};

/**
 * Optional authentication - sets req.user if token is valid, but doesn't fail if missing
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET!) as any;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      // Silently ignore token errors in optional auth
    }
  }

  next();
};
