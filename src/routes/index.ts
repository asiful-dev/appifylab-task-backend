import { Router } from 'express';
import { authRoutes } from './auth.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
