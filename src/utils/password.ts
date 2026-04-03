import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const SALT_ROUNDS = 12;

export const hashPassword = async (plainPassword: string) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

export const comparePassword = async (plainPassword: string, passwordHash: string) => {
  return bcrypt.compare(plainPassword, passwordHash);
};

export const hashToken = (token: string) => {
  return createHash('sha256').update(token).digest('hex');
};
