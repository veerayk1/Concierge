/**
 * API client — wraps fetch with the contract the existing backend
 * already exposes at /api/v1/*.
 *
 * Behaviour:
 *   - Reads the access token from SecureStore on every call. No
 *     in-memory cache; we never want a stale token after logout.
 *   - On 401, attempts a single refresh via /api/auth/refresh and
 *     retries the original call. If the refresh also fails, throws
 *     UnauthorizedError so the AuthContext can sign the user out.
 *   - Surfaces the API's `{ error, message, code }` shape as a typed
 *     ApiError so screens can show real error messages.
 *   - Aborts requests after 15s — mobile networks lie about
 *     connectivity and we never want a spinner that runs forever.
 */

import Constants from 'expo-constants';

import {
  clearAllAuth,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/auth/storage';

const DEFAULT_TIMEOUT_MS = 15_000;

function getBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;
  if (extra?.apiBaseUrl) return extra.apiBaseUrl;
  // Local dev fallback — the device emulator can't reach localhost.
  // The user should set `extra.apiBaseUrl` to their LAN IP, e.g.
  // http://192.168.1.42:3000, via app.json or expo-constants overrides.
  return 'https://concierge.app';
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly fields?: Record<string, string[]>;

  constructor(status: number, message: string, code?: string, fields?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.code = code;
    if (fields) this.fields = fields;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Session expired. Please sign in again.') {
    super(401, message, 'UNAUTHORIZED');
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData | null;
  /** Skip the auth header — for /api/auth/login. */
  skipAuth?: boolean;
  /** Override default 15s timeout. */
  timeoutMs?: number;
}

async function buildHeaders(skipAuth: boolean, isFormData: boolean): Promise<Headers> {
  const headers = new Headers();
  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');
  if (!skipAuth) {
    const token = await getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

async function rawFetch(url: string, options: RequestOptions): Promise<Response> {
  const isFormData = options.body instanceof FormData;
  const headers = await buildHeaders(options.skipAuth ?? false, isFormData);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
      body:
        options.body === null || options.body === undefined
          ? undefined
          : isFormData
            ? (options.body as FormData)
            : JSON.stringify(options.body),
    });
  } finally {
    clearTimeout(timer);
  }
}

async function tryRefresh(): Promise<boolean> {
  const refresh = await getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${getBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken?: string; refreshToken?: string };
    if (!data.accessToken) return false;
    await setAccessToken(data.accessToken);
    if (data.refreshToken) await setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function apiCall<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  let res = await rawFetch(url, options);

  if (res.status === 401 && !options.skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawFetch(url, options);
    } else {
      await clearAllAuth();
      throw new UnauthorizedError();
    }
  }

  if (!res.ok) {
    let payload: {
      error?: string;
      message?: string;
      code?: string;
      fields?: Record<string, string[]>;
    } = {};
    try {
      payload = await res.json();
    } catch {
      // Body was empty or not JSON — fall through with defaults.
    }
    throw new ApiError(
      res.status,
      payload.message ?? payload.error ?? `Request failed (${res.status})`,
      payload.code,
      payload.fields,
    );
  }

  // 204 No Content has no body to parse.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function getApiBaseUrl(): string {
  return getBaseUrl();
}
