import { NextFunction, Request, Response } from 'express';
import { postService } from '../services/post.service.js';
import { UnauthorizedError, ValidationError } from '../utils/errorTypes.js';
import {
  createPostSchema,
  feedQuerySchema,
  updatePostSchema,
} from '../validators/post.validator.js';

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

export const postController = {
  async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const queryParsed = feedQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        throw new ValidationError(
          queryParsed.error.issues.map((issue) => issue.message).join(', '),
        );
      }

      const result = await postService.getFeed(userId, queryParsed.data);
      res.status(200).json({
        success: true,
        data: {
          posts: result.posts,
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

  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const bodyParsed = createPostSchema.safeParse(req.body);
      if (!bodyParsed.success) {
        throw new ValidationError(bodyParsed.error.issues.map((issue) => issue.message).join(', '));
      }

      const post = await postService.createPost(userId, bodyParsed.data, req.file);
      res.status(201).json({
        success: true,
        data: {
          post,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getPostById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const postId = getParam(req.params.id, 'id');
      const post = await postService.getPostById(userId, postId);

      res.status(200).json({
        success: true,
        data: {
          post,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updatePost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const postId = getParam(req.params.id, 'id');
      const input = req.body;
      const post = await postService.updatePost(userId, postId, input);

      res.status(200).json({
        success: true,
        data: {
          post,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getAuthUserId(req);
      const postId = getParam(req.params.id, 'id');
      await postService.deletePost(userId, postId);

      res.status(200).json({
        success: true,
        data: {
          message: 'Post deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = getAuthUserId(req);
      const targetUserId = getParam(req.params.id, 'id');
      const queryParsed = feedQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        throw new ValidationError(
          queryParsed.error.issues.map((issue) => issue.message).join(', '),
        );
      }

      const result = await postService.getUserPosts(requesterId, targetUserId, queryParsed.data);
      res.status(200).json({
        success: true,
        data: {
          posts: result.posts,
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

  updatePostInputValidation: updatePostSchema,
};
