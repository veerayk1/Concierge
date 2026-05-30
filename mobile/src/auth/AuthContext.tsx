import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

import { login as apiLogin, fetchMe, logout as apiLogout } from '@/api/auth';
import { ApiError } from '@/api/client';

import {
  clearAllAuth,
  getAccessToken,
  getStoredUser,
  setAccessToken,
  setRefreshToken,
  setStoredUser,
  StoredUser,
} from './storage';

interface AuthContextValue {
  user: StoredUser | null;
  loading: boolean;
  /** Set after hydration completes so navigators can decide what to render. */
  hydrated: boolean;
  /** Resolves to a user on success, throws on failure, returns null on MFA. */
  signIn: (email: string, password: string) => Promise<StoredUser | null>;
  signOut: () => Promise<void>;
  /** Re-fetch /api/v1/users/me — useful after profile edits. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from SecureStore on mount. If the token is present, also
  // round-trip /api/v1/users/me to verify it's still valid; if the
  // server rejects, the apiCall wrapper will have already cleared
  // storage by the time we check.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [token, storedUser] = await Promise.all([getAccessToken(), getStoredUser()]);
      if (cancelled) return;
      if (!token || !storedUser) {
        setHydrated(true);
        return;
      }
      setUser(storedUser);
      // Best-effort refresh of the user record so role / unitId stay
      // current after admin edits. If this fails the user can keep
      // working with the cached profile — the next protected call
      // will trigger re-auth if the token is truly dead.
      try {
        const fresh = await fetchMe();
        if (cancelled) return;
        const merged: StoredUser = {
          id: fresh.id,
          email: fresh.email,
          firstName: fresh.firstName,
          lastName: fresh.lastName,
          role: fresh.role,
          ...(fresh.propertyId !== undefined ? { propertyId: fresh.propertyId } : {}),
          ...(fresh.unitId !== undefined ? { unitId: fresh.unitId } : {}),
        };
        await setStoredUser(merged);
        setUser(merged);
      } catch {
        // Swallow — cached user is good enough until next API call.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await apiLogin(email.trim(), password);
      if ('mfaRequired' in result && result.mfaRequired) {
        // MFA flow — caller navigates to a verify-code screen.
        return null;
      }
      const loginResult = result as Exclude<typeof result, { mfaRequired: true }>;
      await Promise.all([
        setAccessToken(loginResult.accessToken),
        setRefreshToken(loginResult.refreshToken),
      ]);
      const stored: StoredUser = {
        id: loginResult.user.id,
        email: loginResult.user.email,
        firstName: loginResult.user.firstName,
        lastName: loginResult.user.lastName,
        role: loginResult.user.role,
        ...(loginResult.user.propertyId !== undefined
          ? { propertyId: loginResult.user.propertyId }
          : {}),
        ...(loginResult.user.unitId !== undefined ? { unitId: loginResult.user.unitId } : {}),
      };
      await setStoredUser(stored);
      setUser(stored);
      return stored;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      // Best-effort server-side invalidation; never block UX on it.
      try {
        await apiLogout();
      } catch (err) {
        if (!(err instanceof ApiError) || err.status !== 401) {
          console.warn('[auth] logout call failed, proceeding to clear local state', err);
        }
      }
      await clearAllAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await fetchMe();
      const merged: StoredUser = {
        id: fresh.id,
        email: fresh.email,
        firstName: fresh.firstName,
        lastName: fresh.lastName,
        role: fresh.role,
        ...(fresh.propertyId !== undefined ? { propertyId: fresh.propertyId } : {}),
        ...(fresh.unitId !== undefined ? { unitId: fresh.unitId } : {}),
      };
      await setStoredUser(merged);
      setUser(merged);
    } catch (err) {
      console.warn('[auth] refreshUser failed', err);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, hydrated, signIn, signOut, refreshUser }),
    [user, loading, hydrated, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
