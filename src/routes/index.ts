import { Router } from 'express';
import { commentRoutes } from './comment.routes.js';
import { postController } from '../controllers/post.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authRoutes } from './auth.routes.js';
import { likeRoutes } from './like.routes.js';
import { postRoutes } from './post.routes.js';
import { userRoutes } from './user.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.get('/users/:id/posts', authenticateToken, postController.getUserPosts);
apiRouter.use('/posts', postRoutes);
apiRouter.use('/', commentRoutes);
apiRouter.use('/', likeRoutes);
