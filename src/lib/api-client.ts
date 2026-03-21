/**
 * Concierge — API Client
 *
 * Fetch wrapper with automatic Authorization header, token refresh on 401,
 * JSON parsing, and standardized error handling.
 *
 * @module lib/api-client
 */

import type { ApiError, ApiResponse } from '@/types';

// ---------------------------------------------------------------------------
// Token Storage (client-side only)
// ---------------------------------------------------------------------------

let accessToken: string | null = null;
let refreshToken: string | null = null;

/** Set the current access token (persists to localStorage for HMR resilience). */
export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
}

/** Get the current access token (in-memory first, localStorage fallback). */
export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  // Fallback: check localStorage for token persisted across HMR/page reloads
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('auth_token');
    if (stored) {
      accessToken = stored;
      return stored;
    }
  }
  return null;
}

/** Set the current refresh token. */
export function setRefreshToken(token: string | null): void {
  refreshToken = token;
}

/** Get the current refresh token. */
export function getRefreshToken(): string | null {
  return refreshToken;
}

/** Clear all stored tokens. */
export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh');
    localStorage.removeItem('auth_user');
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiClientOptions extends Omit<RequestInit, 'body'> {
  /** JSON body — automatically serialized. */
  body?: unknown;
  /** Skip automatic Authorization header attachment. */
  skipAuth?: boolean;
  /** Skip automatic 401 → refresh → retry flow. */
  skipRefresh?: boolean;
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly requestId: string;
  public readonly fields?: ApiError['fields'];

  constructor(error: ApiError, status: number) {
    super(error.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = error.code;
    this.requestId = error.requestId;
    this.fields = error.fields;
  }
}

// ---------------------------------------------------------------------------
// Refresh Lock (prevents concurrent refresh requests)
// ---------------------------------------------------------------------------

let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (!refreshToken) return false;

  // If a refresh is already in progress, wait for it
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearTokens();
        return false;
      }

      const json = (await response.json()) as ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }>;

      setAccessToken(json.data.accessToken);
      setRefreshToken(json.data.refreshToken);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client: use relative URLs (same origin)
    return '';
  }
  // Server: use the configured app URL
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

// ---------------------------------------------------------------------------
// Core Fetch Wrapper
// ---------------------------------------------------------------------------

/**
 * Type-safe fetch wrapper with automatic auth and refresh.
 *
 * @param path - API path starting with `/api/`.
 * @param options - Fetch options with JSON body support.
 * @returns Parsed response data.
 * @throws {ApiClientError} on non-2xx responses.
 */
export async function apiClient<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const { body, skipAuth, skipRefresh, headers: customHeaders, ...fetchOptions } = options;

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Attach Authorization header
  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Handle 401 with automatic token refresh
  if (response.status === 401 && !skipAuth && !skipRefresh) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      // Retry the original request with the new token
      const retryHeaders: Record<string, string> = {
        ...headers,
      };
      if (accessToken) {
        retryHeaders['Authorization'] = `Bearer ${accessToken}`;
      }

      const retryResponse = await fetch(url, {
        ...fetchOptions,
        headers: retryHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (!retryResponse.ok) {
        const errorBody = (await retryResponse.json().catch(() => ({
          error: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
          requestId: '',
        }))) as ApiError;
        throw new ApiClientError(errorBody, retryResponse.status);
      }

      const retryJson = (await retryResponse.json()) as ApiResponse<T>;
      return retryJson.data;
    }

    // Refresh failed — throw the 401
    const errorBody = (await response.json().catch(() => ({
      error: 'AUTH_ERROR',
      message: 'Session expired',
      code: 'AUTH_ERROR',
      requestId: '',
    }))) as ApiError;
    throw new ApiClientError(errorBody, 401);
  }

  // Handle non-2xx responses
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      requestId: '',
    }))) as ApiError;
    throw new ApiClientError(errorBody, response.status);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}
