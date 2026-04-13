/**
 * API Guard Tests — Authentication + Authorization
 *
 * Tests the guard that EVERY API route must use.
 * This is the single most important security component.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { guardRoute } from './api-guard';

// Mock the auth module
vi.mock('@/server/middleware/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/server/errors', () => ({
  AuthError: class AuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthError';
    }
  },
}));

import { requireAuth } from '@/server/middleware/auth';
import { AuthError } from '@/server/errors';

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/users', {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('guardRoute — Authentication', () => {
  it('returns 401 when no token is provided and not in demo mode', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Missing authorization token'));

    const req = makeRequest();
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    if (result.error) {
      expect(result.error.status).toBe(401);
    }
  });

  it('returns authenticated user when valid token is provided', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      sub: 'user-123',
      pid: 'prop-123',
      role: 'property_admin',
      perms: ['users.create', 'users.read'],
      mfa: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).toBeNull();
    expect(result.user).not.toBeNull();
    if (result.user) {
      expect(result.user.userId).toBe('user-123');
      expect(result.user.propertyId).toBe('prop-123');
      expect(result.user.role).toBe('property_admin');
    }
  });

  it('returns 401 for expired tokens', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Token has expired'));

    const req = makeRequest({ Authorization: 'Bearer expired-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    if (result.error) {
      expect(result.error.status).toBe(401);
    }
  });

  it('returns 401 for tampered tokens', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Invalid token signature'));

    const req = makeRequest({ Authorization: 'Bearer tampered-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    if (result.error) {
      expect(result.error.status).toBe(401);
    }
  });
});

describe('guardRoute — Role-Based Authorization', () => {
  it('returns 403 when user role is not in allowed roles', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      sub: 'user-123',
      pid: 'prop-123',
      role: 'security_guard',
      perms: ['events.read'],
      mfa: false,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, {
      roles: ['super_admin', 'property_admin'],
      allowDemo: false,
    });

    expect(result.error).not.toBeNull();
    if (result.error) {
      expect(result.error.status).toBe(403);
    }
  });

  it('allows access when user role IS in allowed roles', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      sub: 'user-123',
      pid: 'prop-123',
      role: 'property_admin',
      perms: ['*'],
      mfa: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, {
      roles: ['super_admin', 'property_admin'],
      allowDemo: false,
    });

    expect(result.error).toBeNull();
    expect(result.user?.role).toBe('property_admin');
  });

  it('allows ANY authenticated user when no roles specified', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      sub: 'user-123',
      pid: 'prop-123',
      role: 'resident_tenant',
      perms: ['packages.read'],
      mfa: false,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).toBeNull();
    expect(result.user?.role).toBe('resident_tenant');
  });
});

describe('guardRoute — Demo Mode', () => {
  it('allows demo mode when x-demo-role header is present', async () => {
    const req = makeRequest({ 'x-demo-role': 'property_admin' });
    const result = await guardRoute(req, { allowDemo: true });

    expect(result.error).toBeNull();
    expect(result.user?.role).toBe('property_admin');
    expect(result.user?.userId).toBe('00000000-0000-4000-a000-000000000001');
  });

  it('enforces role checks even in demo mode', async () => {
    const req = makeRequest({ 'x-demo-role': 'security_guard' });
    const result = await guardRoute(req, {
      roles: ['super_admin', 'property_admin'],
      allowDemo: true,
    });

    expect(result.error).not.toBeNull();
    if (result.error) {
      expect(result.error.status).toBe(403);
    }
  });

  it('demo mode is disabled when allowDemo=false', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Missing authorization token'));

    const req = makeRequest({ 'x-demo-role': 'property_admin' });
    const result = await guardRoute(req, { allowDemo: false });

    // Should return 401 because demo mode is disabled
    expect(result.error).not.toBeNull();
    if (result.error) {
      expect(result.error.status).toBe(401);
    }
  });

  it('demo mode is disabled when DEMO_MODE_DISABLED=true', async () => {
    const origDemo = process.env.DEMO_MODE_DISABLED;
    process.env.DEMO_MODE_DISABLED = 'true';

    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Missing authorization token'));

    const req = makeRequest({ 'x-demo-role': 'property_admin' });
    const result = await guardRoute(req);

    // With DEMO_MODE_DISABLED=true, demo headers should be ignored
    expect(result.error).not.toBeNull();
    if (result.error) {
      expect(result.error.status).toBe(401);
    }

    if (origDemo !== undefined) {
      process.env.DEMO_MODE_DISABLED = origDemo;
    } else {
      delete process.env.DEMO_MODE_DISABLED;
    }
  });

  it('demo mode works by default (DEMO_MODE_DISABLED not set)', async () => {
    const origDemo = process.env.DEMO_MODE_DISABLED;
    delete process.env.DEMO_MODE_DISABLED;

    const req = makeRequest({ 'x-demo-role': 'property_admin' });
    const result = await guardRoute(req);

    // Without DEMO_MODE_DISABLED, demo mode should work
    expect(result.error).toBeNull();
    expect(result.user).not.toBeNull();
    expect(result.user?.role).toBe('property_admin');

    if (origDemo !== undefined) {
      process.env.DEMO_MODE_DISABLED = origDemo;
    } else {
      delete process.env.DEMO_MODE_DISABLED;
    }
  });
});
