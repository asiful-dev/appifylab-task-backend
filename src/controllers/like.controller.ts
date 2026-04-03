import { NextFunction, Request, Response } from 'express';
import { likeService } from '../services/like.service.js';
import { UnauthorizedError, ValidationError } from '../utils/errorTypes.js';
import { listQuerySchema } from '../validators/comment.validator.js';

const getAuthUserId = (req: Request) => {
  if (!req.user?.id) {
    throw new UnauthorizedError('Missing authenticated user context');
  }

  return req.user.id;
};

const getParam = (value: string | string[] | undefined, fieldName: string) => {
  if (!value) {
    throw new ValidationError(`${fieldName} is required`);
  }

  return Array.isArray(value) ? value[0] : value;
};

export const likeController = {
  async togglePostLike(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const postId = getParam(req.params.id, 'id');
      const result = await likeService.togglePostLike(userId, postId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async toggleCommentLike(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const commentId = getParam(req.params.id, 'id');
      const result = await likeService.toggleCommentLike(userId, commentId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async listPostLikes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const postId = getParam(req.params.id, 'id');
      const queryParsed = listQuerySchema.safeParse(req.query);

      if (!queryParsed.success) {
        throw new ValidationError(
          queryParsed.error.issues.map((issue) => issue.message).join(', '),
        );
      }

      const result = await likeService.listPostLikes(userId, postId, queryParsed.data);
      res.status(200).json({
        success: true,
        data: {
          users: result.users,
        },
        meta: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async listCommentLikes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const commentId = getParam(req.params.id, 'id');
      const queryParsed = listQuerySchema.safeParse(req.query);

      if (!queryParsed.success) {
        throw new ValidationError(
          queryParsed.error.issues.map((issue) => issue.message).join(', '),
        );
      }

      const result = await likeService.listCommentLikes(userId, commentId, queryParsed.data);
      res.status(200).json({
        success: true,
        data: {
          users: result.users,
        },
        meta: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
