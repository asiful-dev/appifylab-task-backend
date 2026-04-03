import { Router } from 'express';
import { commentController } from '../controllers/comment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

export const commentRoutes = Router();

/**
 * @openapi
 * /api/posts/{postId}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: List post comments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessCommentsResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
commentRoutes.get('/posts/:postId/comments', authenticateToken, commentController.listPostComments);

/**
 * @openapi
 * /api/posts/{postId}/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Create a comment on post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       201:
 *         description: Created comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessCommentResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
commentRoutes.post('/posts/:postId/comments', authenticateToken, commentController.createComment);

/**
 * @openapi
 * /api/comments/{commentId}/replies:
 *   post:
 *     tags: [Comments]
 *     summary: Create a reply to comment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       201:
 *         description: Created reply
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessReplyResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
commentRoutes.post(
  '/comments/:commentId/replies',
  authenticateToken,
  commentController.createReply,
);

/**
 * @openapi
 * /api/comments/{commentId}/replies:
 *   get:
 *     tags: [Comments]
 *     summary: List replies for a comment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of replies
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessRepliesResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
commentRoutes.get('/comments/:commentId/replies', authenticateToken, commentController.listReplies);

/**
 * @openapi
 * /api/comments/{id}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete own comment
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comment deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessageResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
commentRoutes.delete('/comments/:id', authenticateToken, commentController.deleteComment);
