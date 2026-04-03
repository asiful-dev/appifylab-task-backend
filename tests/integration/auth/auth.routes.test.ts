import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const registerMock = vi.fn();
const loginMock = vi.fn();
const refreshMock = vi.fn();
const logoutMock = vi.fn();

vi.mock('../../../src/services/auth.service.js', () => ({
  authService: {
    register: registerMock,
    login: loginMock,
    refresh: refreshMock,
    logout: logoutMock,
  },
}));

const { default: app } = await import('../../../src/app.js');

describe('Auth routes', () => {
  beforeEach(() => {
    registerMock.mockReset();
    loginMock.mockReset();
    refreshMock.mockReset();
    logoutMock.mockReset();
  });

  it('registers a user and returns access token', async () => {
    registerMock.mockResolvedValue({
      user: {
        id: 'user-1',
        firstName: 'Asiful',
        lastName: 'Islam',
        email: 'asiful@example.com',
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    });

    const response = await request(app).post('/api/auth/register').send({
      firstName: 'Asiful',
      lastName: 'Islam',
      email: 'asiful@example.com',
      password: 'Strong@123',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBe('access-token');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('logs in and sets refresh cookie', async () => {
    loginMock.mockResolvedValue({
      user: {
        id: 'user-1',
        firstName: 'Asiful',
        lastName: 'Islam',
        email: 'asiful@example.com',
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'asiful@example.com',
      password: 'Strong@123',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBe('access-token');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('refreshes token when cookie exists', async () => {
    refreshMock.mockResolvedValue({
      user: {
        id: 'user-1',
        firstName: 'Asiful',
        lastName: 'Islam',
        email: 'asiful@example.com',
      },
      tokens: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    });

    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=existing-refresh-token']);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBe('new-access-token');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 when refresh cookie is missing', async () => {
    const response = await request(app).post('/api/auth/refresh');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('logs out and clears cookie', async () => {
    logoutMock.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['refreshToken=existing-refresh-token']);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.message).toBe('Logged out successfully');
    expect(response.headers['set-cookie']).toBeDefined();
  });
});
