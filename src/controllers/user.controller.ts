import { NextFunction, Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { UnauthorizedError } from '../utils/errorTypes.js';
import { ChangePasswordInput, UpdateProfileInput } from '../types/user.types.js';

const getAuthUserId = (req: Request) => {
  if (!req.user?.id) {
    throw new UnauthorizedError('Missing authenticated user context');
  }

  return req.user.id;
};

export const userController = {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const user = await userService.getMe(userId);

      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const input = req.body as UpdateProfileInput;
      const user = await userService.updateMe(userId, input);

      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const result = await userService.uploadAvatar(userId, req.file as Express.Multer.File);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const input = req.body as ChangePasswordInput;
      const result = await userService.changePassword(userId, input);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getPublicUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const user = await userService.getPublicUser(userId);

      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
