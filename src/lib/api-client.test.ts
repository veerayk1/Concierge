/**
 * Concierge — API Client Tests
 *
 * Tests for the fetch wrapper: auth headers, token refresh on 401,
 * JSON parsing, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  apiClient,
  ApiClientError,
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    headers: new Headers(),
  } as Response;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('api-client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    clearTokens();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ---- Token management ---------------------------------------------------

  describe('token management', () => {
    it('stores and retrieves access token', () => {
      setAccessToken('test-access');
      expect(getAccessToken()).toBe('test-access');
    });

    it('stores and retrieves refresh token', () => {
      setRefreshToken('test-refresh');
      expect(getRefreshToken()).toBe('test-refresh');
    });

    it('clears all tokens', () => {
      setAccessToken('a');
      setRefreshToken('b');
      clearTokens();
      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });
  });

  // ---- Successful requests ------------------------------------------------

  describe('successful requests', () => {
    it('makes a GET request and returns data', async () => {
      const mockData = { items: [1, 2, 3] };
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse(200, { data: mockData, requestId: '1' }),
      );

      const result = await apiClient<typeof mockData>('/api/test');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
      expect(result).toEqual(mockData);
    });

    it('makes a POST request with JSON body', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse(200, { data: { id: '1' }, requestId: '1' }),
      );

      await apiClient('/api/test', {
        method: 'POST',
        body: { name: 'Test' },
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
        }),
      );
    });

    it('attaches Authorization header when access token is set', async () => {
      setAccessToken('my-token');
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse(200, { data: {}, requestId: '1' }),
      );

      await apiClient('/api/test');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        }),
      );
    });

    it('does not attach Authorization header when skipAuth is true', async () => {
      setAccessToken('my-token');
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse(200, { data: {}, requestId: '1' }),
      );

      await apiClient('/api/test', { skipAuth: true });

      const callArgs = vi.mocked(globalThis.fetch).mock.calls[0];
      const headers = callArgs?.[1]?.headers as Record<string, string>;
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  // ---- Error handling -----------------------------------------------------

  describe('error handling', () => {
    it('throws ApiClientError on 422', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse(422, {
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          requestId: 'req-1',
          fields: [{ field: 'email', message: 'Invalid email', code: 'invalid_string' }],
        }),
      );

      try {
        await apiClient('/api/test', { method: 'POST', body: {} });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        const error = err as ApiClientError;
        expect(error.status).toBe(422);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.fields).toHaveLength(1);
      }
    });

    it('throws ApiClientError on 401 without refresh token', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse(401, {
          error: 'AUTH_ERROR',
          message: 'Invalid credentials',
          code: 'AUTH_ERROR',
          requestId: 'req-1',
        }),
      );

      try {
        await apiClient('/api/test');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect((err as ApiClientError).status).toBe(401);
      }
    });

    it('throws ApiClientError on 500', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse(500, {
          error: 'INTERNAL_ERROR',
          message: 'Server error',
          code: 'INTERNAL_ERROR',
          requestId: 'req-1',
        }),
      );

      try {
        await apiClient('/api/test');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect((err as ApiClientError).status).toBe(500);
      }
    });

    it('handles non-JSON error responses gracefully', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error('Not JSON')),
        headers: new Headers(),
      } as Response);

      try {
        await apiClient('/api/test');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect((err as ApiClientError).status).toBe(502);
        expect((err as ApiClientError).code).toBe('UNKNOWN_ERROR');
      }
    });
  });

  // ---- Token refresh on 401 -----------------------------------------------

  describe('token refresh on 401', () => {
    it('refreshes token and retries request on 401', async () => {
      setAccessToken('expired-token');
      setRefreshToken('valid-refresh');

      const fetchMock = vi.mocked(globalThis.fetch);

      // First call: 401
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse(401, {
          error: 'AUTH_ERROR',
          message: 'Token expired',
          code: 'AUTH_ERROR',
          requestId: '1',
        }),
      );

      // Refresh call: success
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse(200, {
          data: {
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
          },
          requestId: '2',
        }),
      );

      // Retry call: success
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse(200, {
          data: { result: 'ok' },
          requestId: '3',
        }),
      );

      const result = await apiClient<{ result: string }>('/api/test');

      expect(result).toEqual({ result: 'ok' });
      expect(getAccessToken()).toBe('new-access');
      expect(getRefreshToken()).toBe('new-refresh');
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('clears tokens and throws when refresh fails', async () => {
      setAccessToken('expired-token');
      setRefreshToken('invalid-refresh');

      const fetchMock = vi.mocked(globalThis.fetch);

      // First call: 401
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse(401, {
          error: 'AUTH_ERROR',
          message: 'Token expired',
          code: 'AUTH_ERROR',
          requestId: '1',
        }),
      );

      // Refresh call: 401 (refresh failed)
      fetchMock.mockResolvedValueOnce(
        mockFetchResponse(401, {
          error: 'AUTH_ERROR',
          message: 'Invalid refresh token',
          code: 'AUTH_ERROR',
          requestId: '2',
        }),
      );

      try {
        await apiClient('/api/test');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
        expect((err as ApiClientError).status).toBe(401);
      }

      expect(getAccessToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
    });

    it('skips refresh when skipRefresh is true', async () => {
      setAccessToken('token');
      setRefreshToken('refresh');

      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        mockFetchResponse(401, {
          error: 'AUTH_ERROR',
          message: 'Invalid',
          code: 'AUTH_ERROR',
          requestId: '1',
        }),
      );

      try {
        await apiClient('/api/test', { skipRefresh: true });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiClientError);
      }

      // Only 1 call — no refresh attempt
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
  });

  // ---- ApiClientError class ------------------------------------------------

  describe('ApiClientError', () => {
    it('has correct properties', () => {
      const err = new ApiClientError(
        {
          error: 'TEST_ERROR',
          message: 'Test message',
          code: 'TEST_ERROR',
          requestId: 'req-123',
          fields: [{ field: 'name', message: 'Required' }],
        },
        422,
      );

      expect(err.name).toBe('ApiClientError');
      expect(err.message).toBe('Test message');
      expect(err.status).toBe(422);
      expect(err.code).toBe('TEST_ERROR');
      expect(err.requestId).toBe('req-123');
      expect(err.fields).toEqual([{ field: 'name', message: 'Required' }]);
    });

    it('is an instance of Error', () => {
      const err = new ApiClientError({ error: 'E', message: 'M', code: 'E', requestId: '' }, 500);
      expect(err).toBeInstanceOf(Error);
    });
  });
});
