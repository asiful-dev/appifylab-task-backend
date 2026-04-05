import { and, eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db } from '../config/database.js';
import { passwordResetTokens, refreshTokens, users } from '../db/schema/schema.js';
import { ConflictError, UnauthorizedError } from '../utils/errorTypes.js';
import { withRetry } from '../utils/db-utils.js';
import { comparePassword, hashPassword, hashToken } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import {
  AuthSession,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '../types/auth.types.js';

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_REFRESH_IN_MS = 7 * 24 * 60 * 60 * 1000;

const toAuthUser = (user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl: string | null;
}) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  profileImageUrl: user.profileImageUrl,
});

const createSession = async (
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl: string | null;
  },
  rememberMe = false,
) => {
  const accessToken = signAccessToken({ userId: user.id, email: user.email });
  const refreshExpiresInMs = rememberMe ? THIRTY_DAYS_IN_MS : DEFAULT_REFRESH_IN_MS;
  const refreshTokenExpiresAt = new Date(Date.now() + refreshExpiresInMs);
  const refreshToken = signRefreshToken(
    { userId: user.id, email: user.email },
    rememberMe ? '30d' : undefined,
  );

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshTokenExpiresAt,
    isRevoked: false,
  });

  const session: AuthSession = {
    user: toAuthUser(user),
    tokens: {
      accessToken,
      refreshToken,
    },
    refreshTokenExpiresAt,
  };

  return session;
};

export const authService = {
  async register(input: RegisterInput) {
    const email = input.email.toLowerCase();
    const passwordHash = await hashPassword(input.password);

    return withRetry(async () => {
      try {
        const createdUsers = await db
          .insert(users)
          .values({
            firstName: input.firstName,
            lastName: input.lastName,
            email,
            passwordHash,
          })
          .returning({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl,
          });

        const createdUser = createdUsers[0];
        return createSession(createdUser);
      } catch (error: any) {
        // Handle unique constraint violation for email
        if (error.code === '23505') {
          throw new ConflictError('Email is already registered');
        }
        throw error;
      }
    });
  },

  async login(input: LoginInput) {
    const email = input.email.toLowerCase();

    const user = await withRetry(async () => {
      const foundUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return foundUsers[0];
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordValid = await comparePassword(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return withRetry(() => createSession(user, input.rememberMe ?? false));
  },

  async refresh(refreshTokenValue: string) {
    const payload = verifyRefreshToken(refreshTokenValue);
    const tokenHashValue = hashToken(refreshTokenValue);

    const storedToken = await withRetry(async () => {
      const storedTokens = await db
        .select({
          id: refreshTokens.id,
          userId: refreshTokens.userId,
          expiresAt: refreshTokens.expiresAt,
          isRevoked: refreshTokens.isRevoked,
        })
        .from(refreshTokens)
        .where(
          and(
            eq(refreshTokens.userId, payload.userId),
            eq(refreshTokens.tokenHash, tokenHashValue),
            eq(refreshTokens.isRevoked, false),
          ),
        )
        .limit(1);

      return storedTokens[0];
    });

    if (!storedToken || storedToken.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    return withRetry(async () => {
      await db
        .update(refreshTokens)
        .set({ isRevoked: true })
        .where(eq(refreshTokens.id, storedToken.id));

      const matchedUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(eq(users.id, payload.userId))
        .limit(1);

      const user = matchedUsers[0];
      if (!user) {
        throw new UnauthorizedError('User not found for refresh token');
      }

      return createSession(user);
    });
  },

  async logout(refreshTokenValue?: string) {
    if (!refreshTokenValue) {
      return;
    }

    const tokenHashValue = hashToken(refreshTokenValue);
    await withRetry(() =>
      db
        .update(refreshTokens)
        .set({ isRevoked: true })
        .where(eq(refreshTokens.tokenHash, tokenHashValue)),
    );
  },

  async forgotPassword(input: ForgotPasswordInput) {
    const email = input.email.toLowerCase();

    const user = await withRetry(async () => {
      const matchedUsers = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return matchedUsers[0];
    });

    if (!user) {
      return {
        message: 'If an account exists for this email, a reset link has been generated.',
      };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHashValue = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await withRetry(() =>
      db.transaction(async (tx) => {
        await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
        await tx.insert(passwordResetTokens).values({
          userId: user.id,
          tokenHash: tokenHashValue,
          expiresAt,
        });
      }),
    );

    return {
      message: 'If an account exists for this email, a reset link has been generated.',
      resetToken: rawToken,
      expiresAt,
    };
  },

  async resetPassword(input: ResetPasswordInput) {
    const tokenHashValue = hashToken(input.token);

    const resetTokenRow = await withRetry(async () => {
      const resetRows = await db
        .select({
          id: passwordResetTokens.id,
          userId: passwordResetTokens.userId,
          expiresAt: passwordResetTokens.expiresAt,
          usedAt: passwordResetTokens.usedAt,
        })
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.tokenHash, tokenHashValue))
        .limit(1);

      return resetRows[0];
    });

    if (!resetTokenRow || resetTokenRow.usedAt || resetTokenRow.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    const newPasswordHash = await hashPassword(input.newPassword);

    await withRetry(() =>
      db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({
            passwordHash: newPasswordHash,
            updatedAt: new Date(),
          })
          .where(eq(users.id, resetTokenRow.userId));

        await tx
          .update(passwordResetTokens)
          .set({ usedAt: new Date() })
          .where(eq(passwordResetTokens.id, resetTokenRow.id));

        await tx
          .update(refreshTokens)
          .set({ isRevoked: true })
          .where(eq(refreshTokens.userId, resetTokenRow.userId));
      }),
    );

    return {
      message: 'Password reset successful',
    };
  },
};
