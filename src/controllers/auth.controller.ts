import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { authService } from '../services/auth.service.js';
import {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '../types/auth.types.js';
import { UnauthorizedError } from '../utils/errorTypes.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const parseDurationToMs = (value: string) => {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === 's') return amount * 1000;
  if (unit === 'm') return amount * 60 * 1000;
  if (unit === 'h') return amount * 60 * 60 * 1000;
  return amount * 24 * 60 * 60 * 1000;
};

const getRefreshCookieConfig = (maxAge: number) => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  path: '/api/auth',
  maxAge,
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as RegisterInput;
      const session = await authService.register(input);

      res.cookie(
        REFRESH_COOKIE_NAME,
        session.tokens.refreshToken,
        getRefreshCookieConfig(parseDurationToMs(env.JWT_REFRESH_EXPIRY)),
      );

      res.status(201).json({
        success: true,
        data: {
          user: session.user,
          accessToken: session.tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as LoginInput;
      const session = await authService.login(input);

      const maxAge = input.rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : parseDurationToMs(env.JWT_REFRESH_EXPIRY);

      res.cookie(REFRESH_COOKIE_NAME, session.tokens.refreshToken, getRefreshCookieConfig(maxAge));

      res.status(200).json({
        success: true,
        data: {
          user: session.user,
          accessToken: session.tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshTokenValue = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

      if (!refreshTokenValue) {
        throw new UnauthorizedError('Missing refresh token cookie');
      }

      const session = await authService.refresh(refreshTokenValue);

      res.cookie(
        REFRESH_COOKIE_NAME,
        session.tokens.refreshToken,
        getRefreshCookieConfig(parseDurationToMs(env.JWT_REFRESH_EXPIRY)),
      );

      res.status(200).json({
        success: true,
        data: {
          user: session.user,
          accessToken: session.tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshTokenValue = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
      await authService.logout(refreshTokenValue);

      res.clearCookie(
        REFRESH_COOKIE_NAME,
        getRefreshCookieConfig(parseDurationToMs(env.JWT_REFRESH_EXPIRY)),
      );

      res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as ForgotPasswordInput;
      const result = await authService.forgotPassword(input);

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
          ...(env.NODE_ENV !== 'production' && result.resetToken
            ? {
                resetToken: result.resetToken,
                expiresAt: result.expiresAt,
              }
            : {}),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as ResetPasswordInput;
      const result = await authService.resetPassword(input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
