import { Router } from 'express';
import { likeController } from '../controllers/like.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

export const likeRoutes = Router();

/**
 * @openapi
 * /api/posts/{id}/like:
 *   post:
 *     tags: [Likes]
 *     summary: Toggle like on post
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toggled like state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessToggleLikeResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
likeRoutes.post('/posts/:id/like', authenticateToken, likeController.togglePostLike);

/**
 * @openapi
 * /api/comments/{id}/like:
 *   post:
 *     tags: [Likes]
 *     summary: Toggle like on comment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toggled like state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessToggleLikeResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
likeRoutes.post('/comments/:id/like', authenticateToken, likeController.toggleCommentLike);

/**
 * @openapi
 * /api/posts/{id}/likes:
 *   get:
 *     tags: [Likes]
 *     summary: List users who liked a post
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users who liked post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessLikeUsersResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
likeRoutes.get('/posts/:id/likes', authenticateToken, likeController.listPostLikes);

/**
 * @openapi
 * /api/comments/{id}/likes:
 *   get:
 *     tags: [Likes]
 *     summary: List users who liked a comment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users who liked comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessLikeUsersResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
likeRoutes.get('/comments/:id/likes', authenticateToken, likeController.listCommentLikes);
