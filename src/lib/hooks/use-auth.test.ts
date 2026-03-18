/**
 * Concierge — useAuth Hook Tests
 *
 * Tests for the client-side auth hook: login, logout, token management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useAuth } from '@/lib/hooks/use-auth';
import * as apiClientModule from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock window.location
const originalLocation = window.location;

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { href: '' },
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: originalLocation,
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    apiClientModule.clearTokens();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it('initializes with no user and loading false', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('login sets user and tokens on success', async () => {
    const mockResponse = {
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      user: {
        id: 'u1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'property_admin' as const,
      },
    };

    vi.spyOn(apiClientModule, 'apiClient').mockResolvedValueOnce(mockResponse);
    const setAccessSpy = vi.spyOn(apiClientModule, 'setAccessToken');
    const setRefreshSpy = vi.spyOn(apiClientModule, 'setRefreshToken');

    const { result } = renderHook(() => useAuth());

    let response: unknown;
    await act(async () => {
      response = await result.current.login('test@example.com', 'password');
    });

    expect(setAccessSpy).toHaveBeenCalledWith('access-123');
    expect(setRefreshSpy).toHaveBeenCalledWith('refresh-123');
    expect(result.current.user).toEqual(mockResponse.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(response).toEqual(mockResponse);
  });

  it('login returns mfa response when mfaRequired', async () => {
    const mfaResponse = { mfaToken: 'mfa-123', mfaRequired: true as const };

    vi.spyOn(apiClientModule, 'apiClient').mockResolvedValueOnce(mfaResponse);

    const { result } = renderHook(() => useAuth());

    let response: unknown;
    await act(async () => {
      response = await result.current.login('test@example.com', 'password');
    });

    expect(response).toEqual(mfaResponse);
    // User should NOT be set when MFA is required
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('login propagates errors', async () => {
    vi.spyOn(apiClientModule, 'apiClient').mockRejectedValueOnce(
      new apiClientModule.ApiClientError(
        {
          error: 'AUTH_ERROR',
          message: 'Invalid credentials',
          code: 'AUTH_ERROR',
          requestId: '1',
        },
        401,
      ),
    );

    const { result } = renderHook(() => useAuth());

    await expect(
      act(async () => {
        await result.current.login('test@example.com', 'wrong');
      }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('logout clears tokens, user, and redirects', async () => {
    // First login
    vi.spyOn(apiClientModule, 'apiClient')
      .mockResolvedValueOnce({
        accessToken: 'a',
        refreshToken: 'r',
        user: {
          id: 'u1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'property_admin' as const,
        },
      })
      // Logout call
      .mockResolvedValueOnce({ message: 'Logged out' });

    const clearSpy = vi.spyOn(apiClientModule, 'clearTokens');

    const { result } = renderHook(() => useAuth());

    // Login
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    expect(result.current.isAuthenticated).toBe(true);

    // Logout
    await act(async () => {
      await result.current.logout();
    });

    expect(clearSpy).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(window.location.href).toBe('/login');
  });

  it('logout clears state even when API call fails', async () => {
    vi.spyOn(apiClientModule, 'apiClient')
      .mockResolvedValueOnce({
        accessToken: 'a',
        refreshToken: 'r',
        user: {
          id: 'u1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'property_admin' as const,
        },
      })
      .mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    await act(async () => {
      await result.current.logout();
    });

    // Should still clear state despite API failure
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
