/**
 * Concierge — Client-Side Auth Hook
 *
 * Provides login, logout, token refresh, and auth state management.
 * Tokens are persisted to localStorage (access + refresh) so a page
 * reload or new tab from a deeplink can recover the session via the
 * 401-→-refresh interceptor — UX-263.
 *
 * @module lib/hooks/use-auth
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  apiClient,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/lib/api-client';
import type { Role } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: Role;
  propertyId?: string;
  requiresAssistance?: boolean; // GAP 8.2
  assistanceNotes?: string | null; // GAP 8.2
  languagePreference?: 'en' | 'fr-CA';
  emailSignature?: string;
}

interface LoginSuccessResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface LoginMfaResponse {
  mfaToken: string;
  mfaRequired: true;
}

type LoginResponse = LoginSuccessResponse | LoginMfaResponse;

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UseAuthReturn {
  /** Current authenticated user, or null if not logged in. */
  user: AuthUser | null;
  /** Whether the auth state is still being determined. */
  loading: boolean;
  /** Whether the user is authenticated. */
  isAuthenticated: boolean;
  /**
   * Attempt login with email and password.
   * Returns the API response data so the caller can handle MFA redirects.
   */
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginResponse>;
  /** Log out, clear tokens, and redirect to /login. */
  logout: () => Promise<void>;
  /** Manually refresh the access token. Returns true on success. */
  refreshAccessToken: () => Promise<boolean>;
  /** Update local user state (e.g. after profile edit). */
  setUser: (user: AuthUser) => void;
}

// ---------------------------------------------------------------------------
// JWT Decode Helper (no external library needed)
// ---------------------------------------------------------------------------

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    const payload = parts[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  // Add 30-second buffer to avoid using a token that's about to expire
  return payload.exp * 1000 < Date.now() + 30_000;
}

/**
 * Reconcile leftover demo/impersonation state with a real authenticated session.
 *
 * A `demo_role` in localStorage drives role-aware views (dashboard, nav) when
 * there is no real user. If a real user logs in or rehydrates, a STALE
 * `demo_role` (e.g. 'property_admin' left over from a prior "Open Portal" or a
 * demo-role switch) would otherwise hijack their view — a super_admin would see
 * a single property's property-admin dashboard with no way back. The ONLY
 * sanctioned impersonation ("Open Portal") sets `demo_mode = 'showcase'` and
 * shows an exit banner, so we preserve that case and purge everything else.
 *
 * Exported for testing.
 */
export function reconcileDemoStateForRealSession(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem('demo_mode') === 'showcase') return; // active, banner-guarded impersonation
  localStorage.removeItem('demo_role');
  localStorage.removeItem('demo_propertyId');
  localStorage.removeItem('demo_return_role');
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Hydrate: restore user from stored token + user data on mount.
  // If the access token is missing or expired, try the refresh token
  // first — previously we bounced straight to /login, which meant
  // every page reload past the 15-min access-TTL forced a re-login
  // even though the refresh token was still valid for 7 days.
  useEffect(() => {
    let cancelled = false;

    const restoreUserFromStorageOrToken = (token: string): void => {
      const payload = decodeJwtPayload(token);
      if (!payload || typeof payload.sub !== 'string') return;
      // A real session is being restored — drop any stale, non-showcase demo
      // impersonation so it can't override this user's role/property view.
      reconcileDemoStateForRealSession();
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null;
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as AuthUser);
          return;
        } catch {
          // Invalid stored user, fall through to token reconstruction
        }
      }
      setUser({
        id: payload.sub,
        email: (payload.email as string) || '',
        firstName: (payload.firstName as string) || '',
        lastName: (payload.lastName as string) || '',
        role: (payload.role as Role) || 'visitor',
        propertyId: payload.pid as string,
      });
    };

    (async () => {
      const token = getAccessToken();
      if (token && !isTokenExpired(token)) {
        restoreUserFromStorageOrToken(token);
        if (!cancelled) setLoading(false);
        return;
      }

      // Access token is missing or expired. Try the refresh token
      // before declaring the user logged out.
      const rt = getRefreshToken();
      if (!rt) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const data = await apiClient<RefreshResponse>('/api/auth/refresh', {
          method: 'POST',
          body: { refreshToken: rt },
          skipAuth: true,
          skipRefresh: true,
        });
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        if (!cancelled) {
          restoreUserFromStorageOrToken(data.accessToken);
          setLoading(false);
        }
      } catch {
        clearTokens();
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false): Promise<LoginResponse> => {
      const data = await apiClient<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password, rememberMe },
        skipAuth: true,
        skipRefresh: true,
      });

      // Check if MFA is required
      if ('mfaRequired' in data && data.mfaRequired) {
        return data;
      }

      // Successful login — store tokens, user, and propertyId for multi-tenancy
      const successData = data as LoginSuccessResponse;
      setAccessToken(successData.accessToken);
      setRefreshToken(successData.refreshToken);
      setUser(successData.user);

      // Persist user for session rehydration (survives HMR + page navigation)
      localStorage.setItem('auth_user', JSON.stringify(successData.user));

      // Clear demo mode localStorage to prevent demo handler from intercepting real API calls
      localStorage.removeItem('demo_role');
      localStorage.removeItem('demo_mode');

      // Store propertyId so all pages can read it via getPropertyId()
      if (successData.user.propertyId) {
        localStorage.setItem('demo_propertyId', successData.user.propertyId);
      }

      return successData;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient<{ message: string }>('/api/auth/logout', {
        method: 'POST',
        skipRefresh: true,
      });
    } catch {
      // Logout is best-effort — always clear client state
    } finally {
      clearTokens();
      setUser(null);
      window.location.href = '/login';
    }
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      // Bug: previously passed the access token as the refresh token,
      // which always 400'd. Use the actual refresh token.
      const rt = getRefreshToken();
      if (!rt) return false;
      const data = await apiClient<RefreshResponse>('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: rt },
        skipAuth: true,
        skipRefresh: true,
      });

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      return true;
    } catch {
      clearTokens();
      setUser(null);
      return false;
    }
  }, []);

  return useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      logout,
      refreshAccessToken,
      setUser,
    }),
    [user, loading, isAuthenticated, login, logout, refreshAccessToken],
  );
}
