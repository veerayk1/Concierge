import type { TokenPayload } from '@/types';
import { prisma } from '@/server/db';

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

  const session = await prisma.session.create({
    data: {
      userId: input.userId,
      deviceFingerprint: input.deviceFingerprint,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      lastActiveAt: now,
      expiresAt,
    },
  });

  return {
    id: session.id,
    userId: session.userId,
    deviceFingerprint: session.deviceFingerprint,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    lastActiveAt: session.lastActiveAt,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  };
}

/**
 * List active sessions for a user. Per A.6.5
 */
export async function listUserSessions(userId: string): Promise<SessionInfo[]> {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  return sessions.map((session) => ({
    id: session.id,
    userId: session.userId,
    deviceFingerprint: session.deviceFingerprint,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    lastActiveAt: session.lastActiveAt,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  }));
}

/**
 * Revoke a specific session. Per A.6.4
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revoke all sessions for a user (e.g., password change). Per A.6.6
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
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
export async function validateSession(payload: TokenPayload): Promise<boolean> {
  const session = await prisma.session.findFirst({
    where: {
      userId: payload.sub,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  return session !== null;
}
