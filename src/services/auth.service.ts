import { and, eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { refreshTokens, users } from '../db/schema/schema.js';
import { ConflictError, UnauthorizedError } from '../utils/errorTypes.js';
import { comparePassword, hashPassword, hashToken } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { AuthSession, LoginInput, RegisterInput } from '../types/auth.types.js';

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_REFRESH_IN_MS = 7 * 24 * 60 * 60 * 1000;

const toAuthUser = (user: { id: string; firstName: string; lastName: string; email: string }) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
});

const createSession = async (
  user: { id: string; firstName: string; lastName: string; email: string },
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
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictError('Email is already registered');
    }

    const passwordHash = await hashPassword(input.password);
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
      });

    const createdUser = createdUsers[0];
    return createSession(createdUser);
  },

  async login(input: LoginInput) {
    const email = input.email.toLowerCase();
    const foundUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = foundUsers[0];

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordValid = await comparePassword(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return createSession(user, input.rememberMe ?? false);
  },

  async refresh(refreshTokenValue: string) {
    const payload = verifyRefreshToken(refreshTokenValue);
    const tokenHashValue = hashToken(refreshTokenValue);

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

    const storedToken = storedTokens[0];
    if (!storedToken || storedToken.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

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
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    const user = matchedUsers[0];
    if (!user) {
      throw new UnauthorizedError('User not found for refresh token');
    }

    return createSession(user);
  },

  async logout(refreshTokenValue?: string) {
    if (!refreshTokenValue) {
      return;
    }

    const tokenHashValue = hashToken(refreshTokenValue);
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.tokenHash, tokenHashValue));
  },
};
