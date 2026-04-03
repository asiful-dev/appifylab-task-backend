import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError, NotFoundError } from '../../../src/utils/errorTypes.js';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '5000';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'publishable-test';
process.env.SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'secret-test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-test';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-test';
process.env.JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
process.env.JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const getFeedMock = vi.fn();
const createPostMock = vi.fn();
const getPostByIdMock = vi.fn();
const updatePostMock = vi.fn();
const deletePostMock = vi.fn();
const getUserPostsMock = vi.fn();

vi.mock('../../../src/services/post.service.js', () => ({
  postService: {
    getFeed: getFeedMock,
    createPost: createPostMock,
    getPostById: getPostByIdMock,
    updatePost: updatePostMock,
    deletePost: deletePostMock,
    getUserPosts: getUserPostsMock,
  },
}));

const { default: app } = await import('../../../src/app.js');

const createAccessToken = () => {
  return jwt.sign(
    { userId: 'f93d9090-8b0f-4fbb-b61f-37fe3ce2f85e', email: 'asiful@example.com' },
    process.env.JWT_ACCESS_SECRET!,
  );
};

const postExample = {
  id: '8bd2df78-f740-4cc3-b20a-a59b1810fa08',
  authorId: 'f93d9090-8b0f-4fbb-b61f-37fe3ce2f85e',
  content: 'Hello from BuddyScript',
  imageUrl: null,
  visibility: 'public' as const,
  likeCount: 0,
  commentCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  author: {
    id: 'f93d9090-8b0f-4fbb-b61f-37fe3ce2f85e',
    firstName: 'Asiful',
    lastName: 'Islam',
    profileImageUrl: null,
  },
};

describe('Post routes', () => {
  beforeEach(() => {
    getFeedMock.mockReset();
    createPostMock.mockReset();
    getPostByIdMock.mockReset();
    updatePostMock.mockReset();
    deletePostMock.mockReset();
    getUserPostsMock.mockReset();
  });

  it('gets feed with pagination metadata', async () => {
    const token = createAccessToken();

    getFeedMock.mockResolvedValue({
      posts: [postExample],
      nextCursor: null,
      hasMore: false,
    });

    const response = await request(app)
      .get('/api/posts?limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.posts.length).toBe(1);
    expect(response.body.meta.hasMore).toBe(false);
  });

  it('creates post', async () => {
    const token = createAccessToken();

    createPostMock.mockResolvedValue(postExample);

    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .field('content', 'Hello from BuddyScript')
      .field('visibility', 'public');

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.post.id).toBe(postExample.id);
  });

  it('gets post by id', async () => {
    const token = createAccessToken();

    getPostByIdMock.mockResolvedValue(postExample);

    const response = await request(app)
      .get(`/api/posts/${postExample.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.post.id).toBe(postExample.id);
  });

  it('updates own post', async () => {
    const token = createAccessToken();

    updatePostMock.mockResolvedValue({
      ...postExample,
      content: 'Updated post content',
    });

    const response = await request(app)
      .patch(`/api/posts/${postExample.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated post content' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.post.content).toBe('Updated post content');
  });

  it('returns 403 when updating others post', async () => {
    const token = createAccessToken();

    updatePostMock.mockRejectedValue(new ForbiddenError('You can only update your own post'));

    const response = await request(app)
      .patch(`/api/posts/${postExample.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated post content' });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('deletes own post', async () => {
    const token = createAccessToken();

    deletePostMock.mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`/api/posts/${postExample.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('returns 404 for unknown post', async () => {
    const token = createAccessToken();

    getPostByIdMock.mockRejectedValue(new NotFoundError('Post'));

    const response = await request(app)
      .get('/api/posts/1b8e709f-4328-4efa-97d7-7ce00779fcc1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('gets user posts from /api/users/:id/posts', async () => {
    const token = createAccessToken();

    getUserPostsMock.mockResolvedValue({
      posts: [postExample],
      nextCursor: null,
      hasMore: false,
    });

    const response = await request(app)
      .get('/api/users/f93d9090-8b0f-4fbb-b61f-37fe3ce2f85e/posts')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.posts.length).toBe(1);
  });

  it('returns 401 for missing bearer token', async () => {
    const response = await request(app).get('/api/posts');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
