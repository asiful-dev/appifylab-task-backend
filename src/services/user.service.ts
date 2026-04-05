import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { env } from '../config/env.js';
import { users } from '../db/schema/schema.js';
import { withRetry } from '../utils/db-utils.js';
import { NotFoundError, UnauthorizedError, ValidationError } from '../utils/errorTypes.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import {
  ChangePasswordInput,
  PublicUserProfileResponse,
  UpdateProfileInput,
  UserProfileResponse,
} from '../types/user.types.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const toUserProfile = (user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string | null;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}): UserProfileResponse => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  bio: user.bio,
  profileImageUrl: user.profileImageUrl,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const toPublicProfile = (user: {
  id: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  profileImageUrl: string | null;
  createdAt: Date;
}): PublicUserProfileResponse => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  bio: user.bio,
  profileImageUrl: user.profileImageUrl,
  createdAt: user.createdAt,
});

const buildAvatarPath = (userId: string, originalName: string) => {
  const sanitizedName = originalName.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
  return `${userId}/${Date.now()}-${sanitizedName}`;
};

const uploadAvatarToSupabase = async (userId: string, file: Express.Multer.File) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new ValidationError('Invalid avatar image type. Allowed: jpg, png, webp, gif');
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new ValidationError('Supabase storage is not configured');
  }

  const path = buildAvatarPath(userId, file.originalname || 'avatar');
  const uploadUrl = `${env.SUPABASE_URL}/storage/v1/object/avatars/${path}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
      apikey: env.SUPABASE_SECRET_KEY,
      'Content-Type': file.mimetype,
      'x-upsert': 'true',
    },
    body: file.buffer,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ValidationError(`Avatar upload failed: ${detail || response.statusText}`);
  }

  return `${env.SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
};

export const userService = {
  async getMe(userId: string) {
    const user = await withRetry(async () => {
      const rows = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          bio: users.bio,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return rows[0];
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return toUserProfile(user);
  },

  async updateMe(userId: string, input: UpdateProfileInput) {
    const user = await withRetry(async () => {
      const updatedRows = await db
        .update(users)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          bio: users.bio,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });

      return updatedRows[0];
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return toUserProfile(user);
  },

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new ValidationError('Avatar file is required');
    }

    const profileImageUrl = await uploadAvatarToSupabase(userId, file);

    const updated = await withRetry(async () => {
      const updatedRows = await db
        .update(users)
        .set({
          profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning({ profileImageUrl: users.profileImageUrl });

      return updatedRows[0];
    });

    if (!updated) {
      throw new NotFoundError('User');
    }

    return {
      profileImageUrl: updated.profileImageUrl,
    };
  },

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await withRetry(async () => {
      const rows = await db
        .select({
          id: users.id,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return rows[0];
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const validCurrentPassword = await comparePassword(input.currentPassword, user.passwordHash);
    if (!validCurrentPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newPasswordHash = await hashPassword(input.newPassword);

    await withRetry(() =>
      db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId)),
    );

    return {
      message: 'Password updated successfully',
    };
  },

  async getPublicUser(userId: string) {
    const user = await withRetry(async () => {
      const rows = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          bio: users.bio,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return rows[0];
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return toPublicProfile(user);
  },
};
