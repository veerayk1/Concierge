'use client';

/**
 * Reusable data fetching hook for API calls
 * Wraps fetch with loading, error, and refetch states
 * Automatically includes demo role header for authenticated API access
 */

import { useCallback, useEffect, useState } from 'react';

/**
 * Get the demo role from localStorage (set on login page)
 */
function getDemoHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const demoRole = localStorage.getItem('demo_role');
  if (demoRole) {
    return { 'x-demo-role': demoRole };
  }
  return {};
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

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...getDemoHeaders(),
        },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
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
  return fetch(url, {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      ...getDemoHeaders(),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}
