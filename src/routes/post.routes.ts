import { Router } from 'express';
import { postController } from '../controllers/post.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { postImageUpload } from '../middleware/upload.middleware.js';

export const postRoutes = Router();

/**
 * @openapi
 * /api/posts:
 *   get:
 *     tags: [Posts]
 *     summary: Get feed posts with cursor pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Feed posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessFeedResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
postRoutes.get('/', authenticateToken, postController.getFeed);

/**
 * @openapi
 * /api/posts:
 *   post:
 *     tags: [Posts]
 *     summary: Create a new post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessPostResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
postRoutes.post('/', authenticateToken, postImageUpload.single('image'), postController.createPost);

/**
 * @openapi
 * /api/posts/{id}:
 *   get:
 *     tags: [Posts]
 *     summary: Get a post by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessPostResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
postRoutes.get('/:id', authenticateToken, postController.getPostById);

/**
 * @openapi
 * /api/posts/{id}:
 *   patch:
 *     tags: [Posts]
 *     summary: Update own post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *               removeImage:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated post
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessPostResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
postRoutes.patch(
  '/:id',
  authenticateToken,
  postImageUpload.single('image'),
  postController.updatePost,
);

/**
 * @openapi
 * /api/posts/{id}:
 *   delete:
 *     tags: [Posts]
 *     summary: Delete own post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Post deleted
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
postRoutes.delete('/:id', authenticateToken, postController.deletePost);
