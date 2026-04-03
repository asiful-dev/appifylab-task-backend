import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../../src/utils/errorTypes.js';

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

const getMeMock = vi.fn();
const updateMeMock = vi.fn();
const uploadAvatarMock = vi.fn();
const changePasswordMock = vi.fn();
const getPublicUserMock = vi.fn();

vi.mock('../../../src/services/user.service.js', () => ({
  userService: {
    getMe: getMeMock,
    updateMe: updateMeMock,
    uploadAvatar: uploadAvatarMock,
    changePassword: changePasswordMock,
    getPublicUser: getPublicUserMock,
  },
}));

const { default: app } = await import('../../../src/app.js');

const createAccessToken = () => {
  return jwt.sign(
    { userId: 'f93d9090-8b0f-4fbb-b61f-37fe3ce2f85e', email: 'asiful@example.com' },
    process.env.JWT_ACCESS_SECRET!,
  );
};

describe('User profile routes', () => {
  beforeEach(() => {
    getMeMock.mockReset();
    updateMeMock.mockReset();
    uploadAvatarMock.mockReset();
    changePasswordMock.mockReset();
    getPublicUserMock.mockReset();
  });

  it('gets current user profile', async () => {
    const token = createAccessToken();

    getMeMock.mockResolvedValue({
      id: 'f93d9090-8b0f-4fbb-b61f-37fe3ce2f85e',
      firstName: 'Asiful',
      lastName: 'Islam',
      email: 'asiful@example.com',
      bio: null,
      profileImageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('asiful@example.com');
  });

  it('returns 401 for missing token', async () => {
    const response = await request(app).get('/api/users/me');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('updates current user profile', async () => {
    const token = createAccessToken();

    updateMeMock.mockResolvedValue({
      id: 'f93d9090-8b0f-4fbb-b61f-37fe3ce2f85e',
      firstName: 'Asiful',
      lastName: 'Islam',
      email: 'asiful@example.com',
      bio: 'Updated bio',
      profileImageUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const response = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'Updated bio' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.bio).toBe('Updated bio');
  });

  it('returns 400 for invalid update payload', async () => {
    const token = createAccessToken();

    const response = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('uploads avatar', async () => {
    const token = createAccessToken();

    uploadAvatarMock.mockResolvedValue({
      profileImageUrl:
        'https://example.supabase.co/storage/v1/object/public/avatars/user/avatar.png',
    });

    const response = await request(app)
      .patch('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('fake-image-content'), 'avatar.png');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.profileImageUrl).toContain('/avatars/');
  });

  it('returns 400 when avatar validation fails', async () => {
    const token = createAccessToken();

    uploadAvatarMock.mockRejectedValue(new ValidationError('Avatar file is required'));

    const response = await request(app)
      .patch('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('changes password', async () => {
    const token = createAccessToken();

    changePasswordMock.mockResolvedValue({
      message: 'Password updated successfully',
    });

    const response = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'OldStrong@123',
        newPassword: 'NewStrong@456',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.message).toBe('Password updated successfully');
  });

  it('returns 401 when current password is wrong', async () => {
    const token = createAccessToken();

    changePasswordMock.mockRejectedValue(new UnauthorizedError('Current password is incorrect'));

    const response = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Wrong@123',
        newPassword: 'NewStrong@456',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('gets public user profile', async () => {
    const token = createAccessToken();

    getPublicUserMock.mockResolvedValue({
      id: '1b8e709f-4328-4efa-97d7-7ce00779fcc1',
      firstName: 'Public',
      lastName: 'User',
      bio: 'Public profile',
      profileImageUrl: null,
      createdAt: new Date().toISOString(),
    });

    const response = await request(app)
      .get('/api/users/1b8e709f-4328-4efa-97d7-7ce00779fcc1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.firstName).toBe('Public');
  });

  it('returns 404 when public user not found', async () => {
    const token = createAccessToken();

    getPublicUserMock.mockRejectedValue(new NotFoundError('User'));

    const response = await request(app)
      .get('/api/users/1b8e709f-4328-4efa-97d7-7ce00779fcc1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
