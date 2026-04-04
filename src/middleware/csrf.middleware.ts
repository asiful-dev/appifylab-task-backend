import { NextFunction, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { env } from '../config/env.js';
import { ForbiddenError } from '../utils/errorTypes.js';

const CSRF_COOKIE_NAME = 'csrfToken';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const createCsrfToken = () => randomBytes(32).toString('hex');

export const getCsrfCookieOptions = () => ({
  httpOnly: false,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api',
});

export const csrfProtection = (req: Request, _res: Response, next: NextFunction) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Allow the refresh endpoint to bootstrap a new CSRF cookie when the client
  // no longer has one. The refresh call itself is still protected by the
  // refresh-token cookie and is made with credentials included from the frontend.
  if (req.path === '/auth/refresh') {
    return next();
  }

  const hasRefreshCookie = Boolean(req.cookies?.refreshToken);
  if (!hasRefreshCookie) {
    return next();
  }

  const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
  const csrfHeader = req.headers['x-csrf-token'];
  const csrfToken = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;

  if (!csrfCookie || !csrfToken || csrfCookie !== csrfToken) {
    return next(new ForbiddenError('Invalid CSRF token'));
  }

  next();
};
