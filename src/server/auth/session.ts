import type { TokenPayload } from '@/types';

/**
 * Session management service.
 * Per SECURITY-RULEBOOK A.6
 */

export interface SessionInfo {
  id: string;
  userId: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateSessionInput {
  userId: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Create a new session. Per A.6
 */
export async function createSession(input: CreateSessionInput): Promise<SessionInfo> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h default

  // TODO: Insert into sessions table via Prisma
  return {
    id: crypto.randomUUID(),
    userId: input.userId,
    deviceFingerprint: input.deviceFingerprint,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    lastActiveAt: now,
    expiresAt,
    createdAt: now,
  };
}

/**
 * List active sessions for a user. Per A.6.5
 */
export async function listUserSessions(_userId: string): Promise<SessionInfo[]> {
  // TODO: Query sessions table via Prisma
  return [];
}

/**
 * Revoke a specific session. Per A.6.4
 */
export async function revokeSession(_sessionId: string): Promise<void> {
  // TODO: Set revokedAt on session record
}

/**
 * Revoke all sessions for a user (e.g., password change). Per A.6.6
 */
export async function revokeAllUserSessions(_userId: string): Promise<void> {
  // TODO: Set revokedAt on all user sessions
}

/**
 * Generate a device fingerprint from request headers.
 */
export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  // Simple fingerprint — in production, use more signals
  const data = `${userAgent}|${ip}`;
  return Array.from(new TextEncoder().encode(data))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 64);
}

/**
 * Validate a token payload against active sessions.
 */
export async function validateSession(_payload: TokenPayload): Promise<boolean> {
  // TODO: Check session exists and is not revoked
  return true;
}
