/**
 * Concierge — Session Module Tests
 *
 * Tests for session creation, retrieval, revocation, and device fingerprinting.
 * Per Security Rulebook A.6.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createSession,
  listUserSessions,
  revokeSession,
  revokeAllUserSessions,
  generateDeviceFingerprint,
  validateSession,
  type CreateSessionInput,
  type SessionInfo,
} from '@/server/auth/session';
import type { TokenPayload } from '@/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_SESSION_INPUT: CreateSessionInput = {
  userId: '550e8400-e29b-41d4-a716-446655440001',
  deviceFingerprint: 'abc123def456',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
};

const MOCK_TOKEN_PAYLOAD: TokenPayload = {
  sub: '550e8400-e29b-41d4-a716-446655440001',
  pid: '550e8400-e29b-41d4-a716-446655440010',
  role: 'property_admin',
  perms: ['event:manage'],
  mfa: true,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 900,
};

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------

describe('createSession', () => {
  it('returns a session object with all required fields', async () => {
    const session = await createSession(VALID_SESSION_INPUT);

    expect(session).toBeDefined();
    expect(session.id).toBeDefined();
    expect(typeof session.id).toBe('string');
    expect(session.userId).toBe(VALID_SESSION_INPUT.userId);
    expect(session.deviceFingerprint).toBe(VALID_SESSION_INPUT.deviceFingerprint);
    expect(session.ipAddress).toBe(VALID_SESSION_INPUT.ipAddress);
    expect(session.userAgent).toBe(VALID_SESSION_INPUT.userAgent);
  });

  it('sets createdAt to approximately now', async () => {
    const before = new Date();
    const session = await createSession(VALID_SESSION_INPUT);
    const after = new Date();

    expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 100);
    expect(session.createdAt.getTime()).toBeLessThanOrEqual(after.getTime() + 100);
  });

  it('sets expiresAt to 24 hours from now by default', async () => {
    const session = await createSession(VALID_SESSION_INPUT);

    const expectedExpiry = new Date(session.createdAt.getTime() + 24 * 60 * 60 * 1000);
    // Allow 1 second tolerance
    expect(Math.abs(session.expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(1000);
  });

  it('sets lastActiveAt to createdAt initially', async () => {
    const session = await createSession(VALID_SESSION_INPUT);

    expect(session.lastActiveAt.getTime()).toBe(session.createdAt.getTime());
  });

  it('generates a unique session ID each time', async () => {
    const session1 = await createSession(VALID_SESSION_INPUT);
    const session2 = await createSession(VALID_SESSION_INPUT);

    expect(session1.id).not.toBe(session2.id);
  });
});

// ---------------------------------------------------------------------------
// listUserSessions
// ---------------------------------------------------------------------------

describe('listUserSessions', () => {
  it('returns an array', async () => {
    const sessions = await listUserSessions(VALID_SESSION_INPUT.userId);

    expect(Array.isArray(sessions)).toBe(true);
  });

  // TODO: Once Prisma integration is complete, add tests for:
  // - returning only active sessions
  // - filtering expired sessions
  // - returning sessions for the specific user only
});

// ---------------------------------------------------------------------------
// revokeSession
// ---------------------------------------------------------------------------

describe('revokeSession', () => {
  it('completes without error for a valid session ID', async () => {
    const session = await createSession(VALID_SESSION_INPUT);

    // Should not throw
    await expect(revokeSession(session.id)).resolves.toBeUndefined();
  });

  it('completes without error for a non-existent session ID', async () => {
    // Idempotent — should not throw
    await expect(revokeSession('non-existent-session-id')).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// revokeAllUserSessions
// ---------------------------------------------------------------------------

describe('revokeAllUserSessions', () => {
  it('completes without error for a valid user ID', async () => {
    await expect(revokeAllUserSessions(VALID_SESSION_INPUT.userId)).resolves.toBeUndefined();
  });

  it('completes without error even when user has no sessions', async () => {
    await expect(revokeAllUserSessions('user-with-no-sessions')).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// generateDeviceFingerprint
// ---------------------------------------------------------------------------

describe('generateDeviceFingerprint', () => {
  it('returns a hex string', () => {
    const fp = generateDeviceFingerprint(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      '192.168.1.1',
    );

    expect(fp).toBeDefined();
    expect(typeof fp).toBe('string');
    expect(fp).toMatch(/^[0-9a-f]+$/);
  });

  it('returns a string of max 64 characters', () => {
    const fp = generateDeviceFingerprint(
      'A very long user agent string that goes on and on',
      '192.168.1.100',
    );

    expect(fp.length).toBeLessThanOrEqual(64);
  });

  it('produces the same fingerprint for identical inputs', () => {
    const fp1 = generateDeviceFingerprint('UA', '1.2.3.4');
    const fp2 = generateDeviceFingerprint('UA', '1.2.3.4');

    expect(fp1).toBe(fp2);
  });

  it('produces different fingerprints for different user agents', () => {
    const fp1 = generateDeviceFingerprint('Chrome/120', '1.2.3.4');
    const fp2 = generateDeviceFingerprint('Firefox/120', '1.2.3.4');

    expect(fp1).not.toBe(fp2);
  });

  it('produces different fingerprints for different IPs', () => {
    const fp1 = generateDeviceFingerprint('Chrome/120', '1.2.3.4');
    const fp2 = generateDeviceFingerprint('Chrome/120', '5.6.7.8');

    expect(fp1).not.toBe(fp2);
  });
});

// ---------------------------------------------------------------------------
// validateSession
// ---------------------------------------------------------------------------

describe('validateSession', () => {
  it('returns a boolean', async () => {
    const result = await validateSession(MOCK_TOKEN_PAYLOAD);

    expect(typeof result).toBe('boolean');
  });

  // TODO: Once Prisma integration is complete, add tests for:
  // - returns false for revoked sessions
  // - returns false for expired sessions
  // - returns true for active sessions
});
