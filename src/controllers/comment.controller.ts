import { NextFunction, Request, Response } from 'express';
import { commentService } from '../services/comment.service.js';
import { UnauthorizedError, ValidationError } from '../utils/errorTypes.js';
import { createCommentSchema, listQuerySchema } from '../validators/comment.validator.js';

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

export const commentController = {
  async listPostComments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const postId = getParam(req.params.postId, 'postId');
      const queryParsed = listQuerySchema.safeParse(req.query);

      if (!queryParsed.success) {
        throw new ValidationError(
          queryParsed.error.issues.map((issue) => issue.message).join(', '),
        );
      }

      const result = await commentService.listPostComments(userId, postId, queryParsed.data);
      res.status(200).json({
        success: true,
        data: {
          comments: result.comments,
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

  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const postId = getParam(req.params.postId, 'postId');
      const bodyParsed = createCommentSchema.safeParse(req.body);

      if (!bodyParsed.success) {
        throw new ValidationError(bodyParsed.error.issues.map((issue) => issue.message).join(', '));
      }

      const comment = await commentService.createComment(userId, postId, bodyParsed.data);
      res.status(201).json({
        success: true,
        data: {
          comment,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async createReply(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const commentId = getParam(req.params.commentId, 'commentId');
      const bodyParsed = createCommentSchema.safeParse(req.body);

      if (!bodyParsed.success) {
        throw new ValidationError(bodyParsed.error.issues.map((issue) => issue.message).join(', '));
      }

      const reply = await commentService.createReply(userId, commentId, bodyParsed.data);
      res.status(201).json({
        success: true,
        data: {
          reply,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async listReplies(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const commentId = getParam(req.params.commentId, 'commentId');
      const queryParsed = listQuerySchema.safeParse(req.query);

      if (!queryParsed.success) {
        throw new ValidationError(
          queryParsed.error.issues.map((issue) => issue.message).join(', '),
        );
      }

      const result = await commentService.listReplies(userId, commentId, queryParsed.data);
      res.status(200).json({
        success: true,
        data: {
          replies: result.comments,
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

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const commentId = getParam(req.params.id, 'id');

      await commentService.deleteComment(userId, commentId);
      res.status(200).json({
        success: true,
        data: {
          message: 'Comment deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
