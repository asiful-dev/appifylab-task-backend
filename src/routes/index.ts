import { Router } from 'express';
import { postController } from '../controllers/post.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authRoutes } from './auth.routes.js';
import { postRoutes } from './post.routes.js';
import { userRoutes } from './user.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.get('/users/:id/posts', authenticateToken, postController.getUserPosts);
apiRouter.use('/posts', postRoutes);
