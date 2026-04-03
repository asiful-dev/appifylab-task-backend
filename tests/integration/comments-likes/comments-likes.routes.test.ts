import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../../../src/utils/errorTypes.js';

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

const listPostCommentsMock = vi.fn();
const createCommentMock = vi.fn();
const createReplyMock = vi.fn();
const listRepliesMock = vi.fn();
const deleteCommentMock = vi.fn();

const togglePostLikeMock = vi.fn();
const toggleCommentLikeMock = vi.fn();
const listPostLikesMock = vi.fn();
const listCommentLikesMock = vi.fn();

vi.mock('../../../src/services/comment.service.js', () => ({
  commentService: {
    listPostComments: listPostCommentsMock,
    createComment: createCommentMock,
    createReply: createReplyMock,
    listReplies: listRepliesMock,
    deleteComment: deleteCommentMock,
  },
}));

vi.mock('../../../src/services/like.service.js', () => ({
  likeService: {
    togglePostLike: togglePostLikeMock,
    toggleCommentLike: toggleCommentLikeMock,
    listPostLikes: listPostLikesMock,
    listCommentLikes: listCommentLikesMock,
  },
}));

const { default: app } = await import('../../../src/app.js');

const createAccessToken = () => {
  return jwt.sign(
    { userId: 'f93d9090-8b0f-4fbb-b61f-37fe3ce2f85e', email: 'asiful@example.com' },
    process.env.JWT_ACCESS_SECRET!,
  );
};

const commentExample = {
  id: 'd22b2d6d-c76f-48e8-95fd-96de9b62bccf',
  postId: '8bd2df78-f740-4cc3-b20a-a59b1810fa08',
  authorId: 'f93d9090-8b0f-4fbb-b61f-37fe3ce2f85e',
  parentId: null,
  content: 'Great post!',
  likeCount: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  author: {
    id: 'f93d9090-8b0f-4fbb-b61f-37fe3ce2f85e',
    firstName: 'Asiful',
    lastName: 'Islam',
    profileImageUrl: null,
  },
};

describe('Comment and like routes', () => {
  beforeEach(() => {
    listPostCommentsMock.mockReset();
    createCommentMock.mockReset();
    createReplyMock.mockReset();
    listRepliesMock.mockReset();
    deleteCommentMock.mockReset();

    togglePostLikeMock.mockReset();
    toggleCommentLikeMock.mockReset();
    listPostLikesMock.mockReset();
    listCommentLikesMock.mockReset();
  });

  it('lists post comments', async () => {
    const token = createAccessToken();

    listPostCommentsMock.mockResolvedValue({
      comments: [commentExample],
      nextCursor: null,
      hasMore: false,
    });

    const response = await request(app)
      .get('/api/posts/8bd2df78-f740-4cc3-b20a-a59b1810fa08/comments')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.comments.length).toBe(1);
  });

  it('creates comment', async () => {
    const token = createAccessToken();

    createCommentMock.mockResolvedValue(commentExample);

    const response = await request(app)
      .post('/api/posts/8bd2df78-f740-4cc3-b20a-a59b1810fa08/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Great post!' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.comment.id).toBe(commentExample.id);
  });

  it('creates reply', async () => {
    const token = createAccessToken();

    createReplyMock.mockResolvedValue({
      ...commentExample,
      id: 'b9ca1774-4a4f-4707-8872-fcbab32a432c',
      parentId: commentExample.id,
    });

    const response = await request(app)
      .post(`/api/comments/${commentExample.id}/replies`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Thanks!' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.reply.parentId).toBe(commentExample.id);
  });

  it('lists replies', async () => {
    const token = createAccessToken();

    listRepliesMock.mockResolvedValue({
      comments: [
        {
          ...commentExample,
          id: 'b9ca1774-4a4f-4707-8872-fcbab32a432c',
          parentId: commentExample.id,
        },
      ],
      nextCursor: null,
      hasMore: false,
    });

    const response = await request(app)
      .get(`/api/comments/${commentExample.id}/replies`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.replies.length).toBe(1);
  });

  it('deletes own comment', async () => {
    const token = createAccessToken();

    deleteCommentMock.mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`/api/comments/${commentExample.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('returns 403 when deleting others comment', async () => {
    const token = createAccessToken();

    deleteCommentMock.mockRejectedValue(new ForbiddenError('You can only delete your own comment'));

    const response = await request(app)
      .delete(`/api/comments/${commentExample.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('toggles post like', async () => {
    const token = createAccessToken();

    togglePostLikeMock.mockResolvedValue({
      liked: true,
      likeCount: 5,
    });

    const response = await request(app)
      .post('/api/posts/8bd2df78-f740-4cc3-b20a-a59b1810fa08/like')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.liked).toBe(true);
  });

  it('toggles comment like', async () => {
    const token = createAccessToken();

    toggleCommentLikeMock.mockResolvedValue({
      liked: false,
      likeCount: 4,
    });

    const response = await request(app)
      .post(`/api/comments/${commentExample.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.liked).toBe(false);
  });

  it('lists post likes', async () => {
    const token = createAccessToken();

    listPostLikesMock.mockResolvedValue({
      users: [commentExample.author],
      nextCursor: null,
      hasMore: false,
    });

    const response = await request(app)
      .get('/api/posts/8bd2df78-f740-4cc3-b20a-a59b1810fa08/likes')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.users.length).toBe(1);
  });

  it('lists comment likes', async () => {
    const token = createAccessToken();

    listCommentLikesMock.mockResolvedValue({
      users: [commentExample.author],
      nextCursor: null,
      hasMore: false,
    });

    const response = await request(app)
      .get(`/api/comments/${commentExample.id}/likes`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.users.length).toBe(1);
  });

  it('returns 401 for missing bearer token', async () => {
    const response = await request(app).get(
      '/api/posts/8bd2df78-f740-4cc3-b20a-a59b1810fa08/comments',
    );

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
