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

/**
 * The web API wraps every success response in an envelope:
 *   { data: <payload>, requestId: string }
 *
 * This was discovered during live QA: the mobile client originally
 * expected top-level { accessToken, ... } and would have failed to
 * log in entirely. Unwrap `.data` here so the rest of the app sees
 * the clean payload.
 */
interface Envelope<T> {
  data: T;
  requestId?: string;
}

export async function login(
  email: string,
  password: string,
  rememberMe = true,
): Promise<LoginResult> {
  const res = await apiCall<Envelope<LoginResult>>('/api/auth/login', {
    method: 'POST',
    body: { email, password, rememberMe },
    skipAuth: true,
  });
  return res.data;
}

export function logout(): Promise<void> {
  return apiCall<void>('/api/auth/logout', { method: 'POST' });
}

export async function fetchMe(): Promise<MeResponse> {
  const res = await apiCall<Envelope<MeResponse>>('/api/v1/users/me');
  return res.data;
}
