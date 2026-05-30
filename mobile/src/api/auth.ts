import { apiCall } from './client';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    propertyId?: string;
    unitId?: string;
    requiresPasswordChange?: boolean;
    activationToken?: string | null;
    isFirstLogin?: boolean;
  };
  mfaRequired?: never;
}

export interface MfaRequiredResponse {
  mfaRequired: true;
  mfaToken: string;
}

export type LoginResult = LoginResponse | MfaRequiredResponse;

export interface MeResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  propertyId?: string;
  unitId?: string;
  phone?: string;
  avatarUrl?: string | null;
}

export function login(email: string, password: string, rememberMe = true): Promise<LoginResult> {
  return apiCall<LoginResult>('/api/auth/login', {
    method: 'POST',
    body: { email, password, rememberMe },
    skipAuth: true,
  });
}

export function logout(): Promise<void> {
  return apiCall<void>('/api/auth/logout', { method: 'POST' });
}

export function fetchMe(): Promise<MeResponse> {
  return apiCall<MeResponse>('/api/v1/users/me');
}
