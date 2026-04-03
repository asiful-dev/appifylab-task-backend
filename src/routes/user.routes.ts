import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { avatarUpload } from '../middleware/upload.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { changePasswordSchema, updateProfileSchema } from '../validators/user.validator.js';

export const userRoutes = Router();

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessUserProfileResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
userRoutes.get('/me', authenticateToken, userController.getMe);

/**
 * @openapi
 * /api/users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *           examples:
 *             updateBio:
 *               value:
 *                 firstName: Asiful
 *                 bio: Full Stack Engineer candidate
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessUserProfileResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
userRoutes.patch(
  '/me',
  authenticateToken,
  validateBody(updateProfileSchema),
  userController.updateMe,
);

/**
 * @openapi
 * /api/users/me/avatar:
 *   patch:
 *     tags: [Users]
 *     summary: Upload or replace profile avatar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessAvatarUploadResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
userRoutes.patch(
  '/me/avatar',
  authenticateToken,
  avatarUpload.single('avatar'),
  userController.uploadAvatar,
);

/**
 * @openapi
 * /api/users/me/password:
 *   patch:
 *     tags: [Users]
 *     summary: Change current user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessageResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
userRoutes.patch(
  '/me/password',
  authenticateToken,
  validateBody(changePasswordSchema),
  userController.changePassword,
);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a public user profile by id
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
 *         description: Public user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessPublicUserResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
userRoutes.get('/:id', authenticateToken, userController.getPublicUser);
