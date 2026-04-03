import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'BuddyScript API',
      version: '1.0.0',
      description: 'Backend API documentation for BuddyScript',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        RegisterRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            firstName: { type: 'string', example: 'Asiful' },
            lastName: { type: 'string', example: 'Islam' },
            email: { type: 'string', format: 'email', example: 'asiful@example.com' },
            password: { type: 'string', example: 'Strong@123' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'asiful@example.com' },
            password: { type: 'string', example: 'Strong@123' },
            rememberMe: { type: 'boolean', example: false },
          },
        },
        AuthUser: {
          type: 'object',
          required: ['id', 'firstName', 'lastName', 'email'],
          properties: {
            id: { type: 'string', format: 'uuid', example: 'f93d9090-8b0f-4fbb-b61f-37fe3ce2f85e' },
            firstName: { type: 'string', example: 'Asiful' },
            lastName: { type: 'string', example: 'Islam' },
            email: { type: 'string', format: 'email', example: 'asiful@example.com' },
          },
        },
        AuthSessionData: {
          type: 'object',
          required: ['user', 'accessToken'],
          properties: {
            user: { $ref: '#/components/schemas/AuthUser' },
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.auth-access-token-example',
            },
          },
        },
        RefreshData: {
          type: 'object',
          required: ['accessToken'],
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.auth-refreshed-access-token-example',
            },
          },
        },
        MessageData: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', example: 'Logged out successfully' },
          },
        },
        ValidationErrorDetails: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: { type: 'string', example: 'ValidationError' },
            message: { type: 'string', example: 'Invalid input payload' },
          },
        },
        UnauthorizedErrorDetails: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: { type: 'string', example: 'UnauthorizedError' },
            message: { type: 'string', example: 'Invalid email or password' },
          },
        },
        ConflictErrorDetails: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: { type: 'string', example: 'ConflictError' },
            message: { type: 'string', example: 'Email is already registered' },
          },
        },
        InternalServerErrorDetails: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: { type: 'string', example: 'INTERNAL_SERVER_ERROR' },
            message: { type: 'string', example: 'Internal server error' },
          },
        },
        ForbiddenErrorDetails: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: { type: 'string', example: 'ForbiddenError' },
            message: { type: 'string', example: 'Access denied' },
          },
        },
        NotFoundErrorDetails: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: { type: 'string', example: 'NotFoundError' },
            message: { type: 'string', example: 'User not found' },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            firstName: { type: 'string', example: 'Asiful' },
            lastName: { type: 'string', example: 'Islam' },
            bio: { type: 'string', example: 'Full Stack Engineer candidate' },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string', example: 'OldStrong@123' },
            newPassword: { type: 'string', example: 'NewStrong@456' },
          },
        },
        UserProfile: {
          type: 'object',
          required: ['id', 'firstName', 'lastName', 'email'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string', example: 'Asiful' },
            lastName: { type: 'string', example: 'Islam' },
            email: { type: 'string', format: 'email', example: 'asiful@example.com' },
            bio: { type: 'string', nullable: true, example: 'Full Stack Engineer candidate' },
            profileImageUrl: {
              type: 'string',
              nullable: true,
              example: 'https://example.supabase.co/storage/v1/object/public/avatars/path.png',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PublicUserProfile: {
          type: 'object',
          required: ['id', 'firstName', 'lastName'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string', example: 'Asiful' },
            lastName: { type: 'string', example: 'Islam' },
            bio: { type: 'string', nullable: true, example: 'Full Stack Engineer candidate' },
            profileImageUrl: {
              type: 'string',
              nullable: true,
              example: 'https://example.supabase.co/storage/v1/object/public/avatars/path.png',
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        UserProfileData: {
          type: 'object',
          required: ['user'],
          properties: {
            user: { $ref: '#/components/schemas/UserProfile' },
          },
        },
        PublicUserData: {
          type: 'object',
          required: ['user'],
          properties: {
            user: { $ref: '#/components/schemas/PublicUserProfile' },
          },
        },
        AvatarUploadData: {
          type: 'object',
          required: ['profileImageUrl'],
          properties: {
            profileImageUrl: {
              type: 'string',
              example: 'https://example.supabase.co/storage/v1/object/public/avatars/path.png',
            },
          },
        },
        PostAuthor: {
          type: 'object',
          required: ['id', 'firstName', 'lastName'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string', example: 'Asiful' },
            lastName: { type: 'string', example: 'Islam' },
            profileImageUrl: {
              type: 'string',
              nullable: true,
              example: 'https://example.supabase.co/storage/v1/object/public/avatars/path.png',
            },
          },
        },
        PostItem: {
          type: 'object',
          required: [
            'id',
            'authorId',
            'visibility',
            'likeCount',
            'commentCount',
            'createdAt',
            'updatedAt',
            'author',
          ],
          properties: {
            id: { type: 'string', format: 'uuid' },
            authorId: { type: 'string', format: 'uuid' },
            content: { type: 'string', nullable: true, example: 'Hello from BuddyScript' },
            imageUrl: {
              type: 'string',
              nullable: true,
              example: 'https://example.supabase.co/storage/v1/object/public/posts/path.png',
            },
            visibility: { type: 'string', enum: ['public', 'private'] },
            likeCount: { type: 'integer', example: 0 },
            commentCount: { type: 'integer', example: 0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            author: { $ref: '#/components/schemas/PostAuthor' },
          },
        },
        FeedMeta: {
          type: 'object',
          required: ['nextCursor', 'hasMore'],
          properties: {
            nextCursor: { type: 'string', nullable: true, format: 'uuid' },
            hasMore: { type: 'boolean', example: false },
          },
        },
        FeedData: {
          type: 'object',
          required: ['posts'],
          properties: {
            posts: {
              type: 'array',
              items: { $ref: '#/components/schemas/PostItem' },
            },
          },
        },
        PostData: {
          type: 'object',
          required: ['post'],
          properties: {
            post: { $ref: '#/components/schemas/PostItem' },
          },
        },
        UpdatePostRequest: {
          type: 'object',
          properties: {
            content: { type: 'string', example: 'Updated post content' },
            visibility: { type: 'string', enum: ['public', 'private'] },
          },
        },
        SuccessAuthSessionResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/AuthSessionData' },
          },
        },
        SuccessUserProfileResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/UserProfileData' },
          },
        },
        SuccessPublicUserResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/PublicUserData' },
          },
        },
        SuccessAvatarUploadResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/AvatarUploadData' },
          },
        },
        SuccessPostResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/PostData' },
          },
        },
        SuccessFeedResponse: {
          type: 'object',
          required: ['success', 'data', 'meta'],
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/FeedData' },
            meta: { $ref: '#/components/schemas/FeedMeta' },
          },
        },
        SuccessRefreshResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/RefreshData' },
          },
        },
        SuccessMessageResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', example: true },
            data: { $ref: '#/components/schemas/MessageData' },
          },
        },
        ValidationErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: { type: 'boolean', example: false },
            error: { $ref: '#/components/schemas/ValidationErrorDetails' },
          },
        },
        UnauthorizedErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: { type: 'boolean', example: false },
            error: { $ref: '#/components/schemas/UnauthorizedErrorDetails' },
          },
        },
        ConflictErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: { type: 'boolean', example: false },
            error: { $ref: '#/components/schemas/ConflictErrorDetails' },
          },
        },
        InternalServerErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: { type: 'boolean', example: false },
            error: { $ref: '#/components/schemas/InternalServerErrorDetails' },
          },
        },
        NotFoundErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: { type: 'boolean', example: false },
            error: { $ref: '#/components/schemas/NotFoundErrorDetails' },
          },
        },
        ForbiddenErrorResponse: {
          type: 'object',
          required: ['success', 'error'],
          properties: {
            success: { type: 'boolean', example: false },
            error: { $ref: '#/components/schemas/ForbiddenErrorDetails' },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UnauthorizedErrorResponse' },
            },
          },
        },
        Conflict: {
          description: 'Conflict in requested operation',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ConflictErrorResponse' },
            },
          },
        },
        InternalServerError: {
          description: 'Unexpected server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InternalServerErrorResponse' },
            },
          },
        },
        NotFound: {
          description: 'Requested resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotFoundErrorResponse' },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden action for current user',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ForbiddenErrorResponse' },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
};

export const openApiSpec = swaggerJsdoc(options);
