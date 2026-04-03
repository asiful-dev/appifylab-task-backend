export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface AuthUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: AuthUserResponse;
  tokens: AuthTokens;
  refreshTokenExpiresAt: Date;
}

export interface JwtPayloadData {
  userId: string;
  email: string;
}
