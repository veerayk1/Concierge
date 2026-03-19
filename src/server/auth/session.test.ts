/**
 * Concierge — Session Module Tests
 *
 * Tests for session creation, retrieval, revocation, and device fingerprinting.
 * Per Security Rulebook A.6.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { TokenPayload } from '@/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockSession } = vi.hoisted(() => ({
  mockSession: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('@/server/db', () => ({
  prisma: {
    session: mockSession,
  },
  default: {
    session: mockSession,
  },
}));

// Import AFTER mock setup
import {
  createSession,
  listUserSessions,
  revokeSession,
  revokeAllUserSessions,
  generateDeviceFingerprint,
  validateSession,
  type CreateSessionInput,
} from '@/server/auth/session';

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

const NOW = new Date();
const FUTURE = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);

const MOCK_DB_SESSION = {
  id: '660e8400-e29b-41d4-a716-446655440099',
  userId: VALID_SESSION_INPUT.userId,
  deviceFingerprint: VALID_SESSION_INPUT.deviceFingerprint,
  ipAddress: VALID_SESSION_INPUT.ipAddress,
  userAgent: VALID_SESSION_INPUT.userAgent,
  lastActiveAt: NOW,
  expiresAt: FUTURE,
  createdAt: NOW,
  revokedAt: null,
};

// ---------------------------------------------------------------------------
// Reset mocks
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------

describe('createSession', () => {
  it('calls prisma.session.create with correct data', async () => {
    mockSession.create.mockResolvedValue(MOCK_DB_SESSION);

    await createSession(VALID_SESSION_INPUT);

    expect(mockSession.create).toHaveBeenCalledOnce();
    const callArg = mockSession.create.mock.calls[0]![0];
    expect(callArg.data.userId).toBe(VALID_SESSION_INPUT.userId);
    expect(callArg.data.deviceFingerprint).toBe(VALID_SESSION_INPUT.deviceFingerprint);
    expect(callArg.data.ipAddress).toBe(VALID_SESSION_INPUT.ipAddress);
    expect(callArg.data.userAgent).toBe(VALID_SESSION_INPUT.userAgent);
  });

  it('returns a session object with all required fields', async () => {
    mockSession.create.mockResolvedValue(MOCK_DB_SESSION);

    const session = await createSession(VALID_SESSION_INPUT);

    expect(session).toBeDefined();
    expect(session.id).toBe(MOCK_DB_SESSION.id);
    expect(session.userId).toBe(VALID_SESSION_INPUT.userId);
    expect(session.deviceFingerprint).toBe(VALID_SESSION_INPUT.deviceFingerprint);
    expect(session.ipAddress).toBe(VALID_SESSION_INPUT.ipAddress);
    expect(session.userAgent).toBe(VALID_SESSION_INPUT.userAgent);
  });

  it('sets expiresAt to 24 hours from now', async () => {
    mockSession.create.mockResolvedValue(MOCK_DB_SESSION);

    await createSession(VALID_SESSION_INPUT);

    const callArg = mockSession.create.mock.calls[0]![0];
    const expiresAt = callArg.data.expiresAt as Date;
    const lastActiveAt = callArg.data.lastActiveAt as Date;
    const diff = expiresAt.getTime() - lastActiveAt.getTime();
    expect(diff).toBe(24 * 60 * 60 * 1000);
  });

  it('generates unique sessions via Prisma (different IDs from DB)', async () => {
    const session1Data = { ...MOCK_DB_SESSION, id: 'id-1' };
    const session2Data = { ...MOCK_DB_SESSION, id: 'id-2' };
    mockSession.create.mockResolvedValueOnce(session1Data).mockResolvedValueOnce(session2Data);

    const s1 = await createSession(VALID_SESSION_INPUT);
    const s2 = await createSession(VALID_SESSION_INPUT);

    expect(s1.id).not.toBe(s2.id);
    expect(mockSession.create).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// listUserSessions
// ---------------------------------------------------------------------------

describe('listUserSessions', () => {
  it('calls prisma.session.findMany with correct filters', async () => {
    mockSession.findMany.mockResolvedValue([]);

    await listUserSessions(VALID_SESSION_INPUT.userId);

    expect(mockSession.findMany).toHaveBeenCalledOnce();
    const callArg = mockSession.findMany.mock.calls[0]![0];
    expect(callArg.where.userId).toBe(VALID_SESSION_INPUT.userId);
    expect(callArg.where.revokedAt).toBeNull();
    expect(callArg.where.expiresAt).toHaveProperty('gt');
  });

  it('returns an array of session objects', async () => {
    mockSession.findMany.mockResolvedValue([MOCK_DB_SESSION]);

    const sessions = await listUserSessions(VALID_SESSION_INPUT.userId);

    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.id).toBe(MOCK_DB_SESSION.id);
    expect(sessions[0]!.userId).toBe(VALID_SESSION_INPUT.userId);
  });

  it('returns empty array when no active sessions', async () => {
    mockSession.findMany.mockResolvedValue([]);

    const sessions = await listUserSessions(VALID_SESSION_INPUT.userId);

    expect(sessions).toEqual([]);
  });

  it('filters out revoked sessions (revokedAt is null in query)', async () => {
    mockSession.findMany.mockResolvedValue([]);

    await listUserSessions(VALID_SESSION_INPUT.userId);

    const callArg = mockSession.findMany.mock.calls[0]![0];
    expect(callArg.where.revokedAt).toBeNull();
  });

  it('filters out expired sessions (expiresAt > now in query)', async () => {
    mockSession.findMany.mockResolvedValue([]);

    await listUserSessions(VALID_SESSION_INPUT.userId);

    const callArg = mockSession.findMany.mock.calls[0]![0];
    const gtDate = callArg.where.expiresAt.gt as Date;
    expect(gtDate).toBeInstanceOf(Date);
    // The date should be approximately now
    expect(Math.abs(gtDate.getTime() - Date.now())).toBeLessThan(5000);
  });
});

// ---------------------------------------------------------------------------
// revokeSession
// ---------------------------------------------------------------------------

describe('revokeSession', () => {
  it('calls prisma.session.update with revokedAt set to now', async () => {
    mockSession.update.mockResolvedValue({ ...MOCK_DB_SESSION, revokedAt: NOW });

    await revokeSession(MOCK_DB_SESSION.id);

    expect(mockSession.update).toHaveBeenCalledOnce();
    const callArg = mockSession.update.mock.calls[0]![0];
    expect(callArg.where.id).toBe(MOCK_DB_SESSION.id);
    expect(callArg.data.revokedAt).toBeInstanceOf(Date);
  });

  it('resolves without returning a value', async () => {
    mockSession.update.mockResolvedValue({ ...MOCK_DB_SESSION, revokedAt: NOW });

    const result = await revokeSession(MOCK_DB_SESSION.id);

    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// revokeAllUserSessions
// ---------------------------------------------------------------------------

describe('revokeAllUserSessions', () => {
  it('calls prisma.session.updateMany for all active sessions of the user', async () => {
    mockSession.updateMany.mockResolvedValue({ count: 3 });

    await revokeAllUserSessions(VALID_SESSION_INPUT.userId);

    expect(mockSession.updateMany).toHaveBeenCalledOnce();
    const callArg = mockSession.updateMany.mock.calls[0]![0];
    expect(callArg.where.userId).toBe(VALID_SESSION_INPUT.userId);
    expect(callArg.where.revokedAt).toBeNull();
    expect(callArg.data.revokedAt).toBeInstanceOf(Date);
  });

  it('resolves without returning a value', async () => {
    mockSession.updateMany.mockResolvedValue({ count: 0 });

    const result = await revokeAllUserSessions(VALID_SESSION_INPUT.userId);

    expect(result).toBeUndefined();
  });

  it('completes without error even when user has no sessions', async () => {
    mockSession.updateMany.mockResolvedValue({ count: 0 });

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
  it('returns true when an active session exists', async () => {
    mockSession.findFirst.mockResolvedValue(MOCK_DB_SESSION);

    const result = await validateSession(MOCK_TOKEN_PAYLOAD);

    expect(result).toBe(true);
  });

  it('returns false when no active session exists', async () => {
    mockSession.findFirst.mockResolvedValue(null);

    const result = await validateSession(MOCK_TOKEN_PAYLOAD);

    expect(result).toBe(false);
  });

  it('queries by userId from token sub field', async () => {
    mockSession.findFirst.mockResolvedValue(null);

    await validateSession(MOCK_TOKEN_PAYLOAD);

    expect(mockSession.findFirst).toHaveBeenCalledOnce();
    const callArg = mockSession.findFirst.mock.calls[0]![0];
    expect(callArg.where.userId).toBe(MOCK_TOKEN_PAYLOAD.sub);
  });

  it('filters out revoked sessions', async () => {
    mockSession.findFirst.mockResolvedValue(null);

    await validateSession(MOCK_TOKEN_PAYLOAD);

    const callArg = mockSession.findFirst.mock.calls[0]![0];
    expect(callArg.where.revokedAt).toBeNull();
  });

  it('filters out expired sessions', async () => {
    mockSession.findFirst.mockResolvedValue(null);

    await validateSession(MOCK_TOKEN_PAYLOAD);

    const callArg = mockSession.findFirst.mock.calls[0]![0];
    expect(callArg.where.expiresAt).toHaveProperty('gt');
    const gtDate = callArg.where.expiresAt.gt as Date;
    expect(gtDate).toBeInstanceOf(Date);
  });
});
