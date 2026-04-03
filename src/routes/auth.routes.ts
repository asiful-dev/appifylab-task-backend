import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

export const authRoutes = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a new account and returns access token in response body and refresh token in httpOnly cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             valid:
 *               summary: Valid registration payload
 *               value:
 *                 firstName: Asiful
 *                 lastName: Islam
 *                 email: asiful@example.com
 *                 password: Strong@123
 *     responses:
 *       201:
 *         description: User registered successfully
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refresh token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessAuthSessionResponse'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     user:
 *                       id: f93d9090-8b0f-4fbb-b61f-37fe3ce2f85e
 *                       firstName: Asiful
 *                       lastName: Islam
 *                       email: asiful@example.com
 *                     accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.auth-access-token-example
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
authRoutes.post('/register', validateBody(registerSchema), authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     description: Authenticates user and returns access token in response body and refresh token in httpOnly cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             standardLogin:
 *               value:
 *                 email: asiful@example.com
 *                 password: Strong@123
 *             rememberMeLogin:
 *               value:
 *                 email: asiful@example.com
 *                 password: Strong@123
 *                 rememberMe: true
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: httpOnly refresh token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessAuthSessionResponse'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     user:
 *                       id: f93d9090-8b0f-4fbb-b61f-37fe3ce2f85e
 *                       firstName: Asiful
 *                       lastName: Islam
 *                       email: asiful@example.com
 *                     accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.auth-access-token-example
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
authRoutes.post('/login', validateBody(loginSchema), authController.login);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using refresh cookie
 *     description: Reads refresh token from cookie, rotates refresh token, and returns a new access token.
 *     responses:
 *       200:
 *         description: Token refreshed
 *         headers:
 *           Set-Cookie:
 *             description: rotated httpOnly refresh token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessRefreshResponse'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     accessToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.auth-refreshed-access-token-example
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
authRoutes.post('/refresh', authController.refresh);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout current user and revoke refresh token
 *     description: Revokes refresh token if present and clears refresh cookie.
 *     responses:
 *       200:
 *         description: Logged out
 *         headers:
 *           Set-Cookie:
 *             description: cleared refresh cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessMessageResponse'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     message: Logged out successfully
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
authRoutes.post('/logout', authController.logout);
