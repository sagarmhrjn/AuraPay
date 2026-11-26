import { UserRole, Permission } from "../constants/auth.const";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  avatarUrl?: string;
  assignedMerchantIds?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds
  tokenType: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  department?: string;
  iat: number;
  exp: number;
  iss?: string;
}
