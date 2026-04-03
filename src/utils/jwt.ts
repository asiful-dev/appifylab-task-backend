import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { JwtPayloadData } from '../types/auth.types.js';

const accessTokenExpiry = env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'];
const refreshTokenExpiry = env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'];

export const signAccessToken = (payload: JwtPayloadData) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET!, { expiresIn: accessTokenExpiry });
};

export const signRefreshToken = (
  payload: JwtPayloadData,
  expiresIn: jwt.SignOptions['expiresIn'] = refreshTokenExpiry,
) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET!, { expiresIn });
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET!) as JwtPayloadData;
};
