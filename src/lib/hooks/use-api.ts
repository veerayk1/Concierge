'use client';

/**
 * Reusable data fetching hook for API calls
 * Wraps fetch with loading, error, and refetch states
 * Automatically includes demo role header for authenticated API access
 */

import { useCallback, useEffect, useState } from 'react';

import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from '@/lib/api-client';
import { reportDebugEvent } from '@/lib/hooks/use-debug-session';

/**
 * Get auth and demo headers for API requests.
 * Demo mode (demo_role in localStorage) takes priority over Bearer tokens
 * to prevent stale/expired tokens from bypassing the demo handler.
 */
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const headers: Record<string, string> = {};

  // Demo mode takes priority — when demo_role is set, always use demo headers
  // so demo requests never fall through to the auth guard with a stale token.
  const rawDemoRole = localStorage.getItem('demo_role');
  if (rawDemoRole) {
    // Map shorthand demo roles to actual Role enum values
    const ROLE_ALIASES: Record<string, string> = {
      resident: 'resident_owner',
      owner: 'resident_owner',
      tenant: 'resident_tenant',
      security: 'security_guard',
      maintenance: 'maintenance_staff',
      admin: 'property_admin',
      manager: 'property_manager',
    };
    const demoRole = ROLE_ALIASES[rawDemoRole] ?? rawDemoRole;
    headers['x-demo-role'] = demoRole;
    const demoMode = localStorage.getItem('demo_mode');
    if (demoMode) {
      headers['x-demo-mode'] = demoMode;
    }
    return headers;
  }

  // Real auth: include Bearer token if available
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns true if the token was refreshed successfully.
 */
let refreshPromise: Promise<boolean> | null = null;
async function attemptRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  // No refresh token available (e.g. page reload — refresh tokens are in-memory only).
  // Return false without clearing tokens so the access token in localStorage is preserved.
  if (!rt) return false;
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) { clearTokens(); return false; }
      const json = await res.json();
      setAccessToken(json.data.accessToken);
      setRefreshToken(json.data.refreshToken);
      return true;
    } catch { clearTokens(); return false; }
    finally { refreshPromise = null; }
  })();
  return refreshPromise;
}

interface UseApiOptions {
  enabled?: boolean;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(url: string | null, options: UseApiOptions = {}): UseApiResult<T> {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url || !enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      const durationMs = performance.now() - startTime;

      // Performance anomaly: report slow API calls (>2s)
      if (durationMs > 2000) {
        const module = url.replace(/^\/api\/v1\//, '').split('/')[0];
        reportDebugEvent({
          type: 'PERFORMANCE_ANOMALY',
          source: 'client',
          severity: 'LOW',
          title: `Slow API response: ${url} took ${Math.round(durationMs)}ms`,
          route: typeof window !== 'undefined' ? window.location.pathname : null,
          module: module ?? null,
          context: { url, durationMs: Math.round(durationMs), status: response.status },
        });
      }

      // On 401, attempt a token refresh and retry once
      if (response.status === 401 && !localStorage.getItem('demo_role')) {
        const refreshed = await attemptRefresh();
        if (refreshed) {
          const retryResponse = await fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
          });
          if (retryResponse.ok) {
            const retryResult = await retryResponse.json();
            setData(retryResult.data ?? retryResult);
            return;
          }
          // Retry also failed — fall through to error handling
          const retryErr = await retryResponse.json().catch(() => ({}));
          setError(retryErr.message || `Failed to fetch (${retryResponse.status})`);
          setData(null);
          return;
        }
        // Refresh failed — only redirect to login if there's no valid token.
        // On first page load after login, refresh tokens are not available
        // (in-memory only), but the access token in localStorage may still be valid.
        // Let the portal layout auth check handle the redirect instead.
        setError('Authentication required');
        setData(null);
        return;
      }

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        // Auto-report 5xx errors
        if (response.status >= 500) {
          const module = url.replace(/^\/api\/v1\//, '').split('/')[0];
          reportDebugEvent({
            type: 'API_ERROR',
            source: 'client',
            severity: 'HIGH',
            title: `API ${response.status} error: ${url}`,
            errorCode: result.error ?? result.code ?? null,
            errorMessage: result.message ?? null,
            requestId: result.requestId ?? null,
            route: typeof window !== 'undefined' ? window.location.pathname : null,
            module: module ?? null,
            context: { url, status: response.status, durationMs: Math.round(durationMs) },
          });
        }

        setError(result.message || `Failed to fetch (${response.status})`);
        setData(null);
        return;
      }

      const result = await response.json();
      setData(result.data ?? result);
    } catch {
      setError('Network error. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [url, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Helper to build API URLs with query params
 */
export function apiUrl(path: string, params: Record<string, string | undefined | null>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  const qs = searchParams.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Helper for authenticated POST/PATCH/DELETE requests
 */
export async function apiRequest(
  url: string,
  options: { method: string; body?: unknown },
): Promise<Response> {
  const response = await fetch(url, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Auto-refresh on 401 and retry once
  if (response.status === 401 && typeof window !== 'undefined' && !localStorage.getItem('demo_role')) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      return fetch(url, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    }
  }

  return response;
}
